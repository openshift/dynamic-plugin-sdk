import { v4 as uuidv4 } from 'uuid';
import type { AnyObject } from '@monorepo/common';
import { consoleLogger, ErrorWithCause } from '@monorepo/common';
import { identity, noop } from 'lodash';
import * as semver from 'semver';
import { DEFAULT_REMOTE_ENTRY_CALLBACK } from '../constants';
import type { ResourceFetch } from '../types/fetch';
import type { PluginManifest } from '../types/plugin';
import type { PluginEntryModule, PluginEntryCallback } from '../types/runtime';
import { basicFetch } from '../utils/basic-fetch';
import { settleAllPromises } from '../utils/promise';
import { injectScriptElement, getScriptElement } from '../utils/scripts';
import { resolveURL } from '../utils/url';
import { pluginManifestSchema } from '../yup-schemas';

declare global {
  interface Window {
    [name: string]: PluginEntryCallback;
  }
}

type PluginLoadData = {
  status: 'pending' | 'loaded' | 'failed';
  manifest: PluginManifest;
  entryCallbackFired?: boolean;
  entryCallbackModule?: PluginEntryModule;
};

type PluginLoadResult =
  | {
      success: true;
      entryModule: PluginEntryModule;
    }
  | {
      success: false;
      errorMessage: string;
      errorCause?: unknown;
    };

type DependencyResolution =
  | {
      success: true;
      version: string;
    }
  | {
      success: false;
    };

export type PluginLoaderOptions = Partial<{
  /**
   * Control which plugins can be loaded.
   *
   * The `reload` argument indicates whether an already loaded plugin is to be reloaded.
   *
   * By default, all plugins are allowed to be loaded.
   */
  canLoadPlugin: (manifest: PluginManifest, reload: boolean) => boolean;

  /**
   * Control whether the given plugin script can be reloaded when attempting to reload
   * the associated plugin.
   *
   * By default, all plugin scripts are allowed to be reloaded.
   */
  canReloadScript: (manifest: PluginManifest, scriptName: string) => boolean;

  /**
   * Customize the global callback function used by plugin entry scripts.
   *
   * This option applies only to plugins using the `callback` registration method.
   */
  entryCallbackSettings: Partial<{
    /**
     * Control whether to register the callback function.
     *
     * Default value: `true`.
     */
    registerCallback: boolean;

    /**
     * Name of the callback function.
     *
     * Default value: `__load_plugin_entry__`.
     */
    name: string;
  }>;

  /**
   * Custom resource fetch implementation.
   *
   * The custom implementation may specify any host application or environment specific
   * request headers that are necessary to fetch plugin resources over the network.
   *
   * By default, a basic {@link fetch} API based implementation is used.
   */
  fetchImpl: ResourceFetch;

  /**
   * Fixed resolutions used when processing plugin dependencies.
   *
   * There are two kinds of dependencies:
   * - Regular dependencies, which refer to actual plugins that must be loaded with
   *   the right version prior to loading the plugin that depends on them.
   * - Environment dependencies, which refer to any environment specific constants
   *   such as the host application's version, runtime platform version, etc.
   *
   * This option should be used to satisfy any environment specific dependencies
   * supported by the host application.
   *
   * Default value: empty object.
   */
  fixedPluginDependencyResolutions: Record<string, string>;

  /**
   * webpack share scope object for initializing `PluginEntryModule` containers.
   *
   * Host applications built with webpack should use dedicated webpack specific APIs
   * such as `__webpack_init_sharing__` and `__webpack_share_scopes__` to initialize
   * and access this object.
   *
   * Default value: empty object.
   *
   * @see https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
   */
  sharedScope: AnyObject;

  /**
   * Post-process the plugin manifest.
   *
   * By default, no post-processing is performed on the manifest.
   */
  postProcessManifest: (manifest: PluginManifest) => PluginManifest;

  /**
   * Provide access to the plugin's entry module.
   *
   * This option applies only to plugins using the `custom` registration method.
   *
   * For example, if a plugin was built with `var` library type (i.e. its entry module
   * is assigned to a variable), you can access the entry module via `window[pluginName]`.
   *
   * By default, this function does nothing.
   */
  getPluginEntryModule: (manifest: PluginManifest) => PluginEntryModule | void;
}>;

/**
 * Loads plugin assets from remote sources.
 */
export class PluginLoader {
  private readonly options: Required<PluginLoaderOptions>;

  /** Plugins processed by this loader. */
  private readonly plugins = new Map<string, PluginLoadData>();

  private readonly loadListeners = new Set<VoidFunction>();

  constructor(options: PluginLoaderOptions = {}) {
    this.options = {
      canLoadPlugin: options.canLoadPlugin ?? (() => true),
      canReloadScript: options.canReloadScript ?? (() => true),
      entryCallbackSettings: options.entryCallbackSettings ?? {},
      fetchImpl: options.fetchImpl ?? basicFetch,
      fixedPluginDependencyResolutions: options.fixedPluginDependencyResolutions ?? {},
      sharedScope: options.sharedScope ?? {},
      postProcessManifest: options.postProcessManifest ?? identity,
      getPluginEntryModule: options.getPluginEntryModule ?? noop,
    };

    this.registerPluginEntryCallback();
  }

  private invokeLoadListeners() {
    this.loadListeners.forEach((listener) => {
      listener();
    });
  }

  /**
   * Load plugin manifest from the given URL.
   */
  async loadPluginManifest(manifestURL: string) {
    const response = await this.options.fetchImpl(manifestURL, { cache: 'no-cache' });
    const responseText = await response.text();

    return JSON.parse(responseText) as PluginManifest;
  }

  /**
   * Post-process and validate the given plugin manifest.
   */
  processPluginManifest(manifest: PluginManifest) {
    const processedManifest = this.options.postProcessManifest(manifest);

    pluginManifestSchema.strict(true).validateSync(processedManifest, { abortEarly: false });

    return processedManifest;
  }

  /**
   * Load plugin from the given manifest.
   *
   * Plugins using the `callback` registration method are expected to call the global entry
   * callback function created via {@link registerPluginEntryCallback} method, passing two
   * arguments: plugin name and the entry module.
   *
   * For plugins using the `custom` registration method, the `getPluginEntryModule` function
   * is expected to return the entry module of the given plugin. If not implemented properly,
   * plugins using the `custom` registration method will fail to load.
   *
   * The resulting Promise never rejects.
   */
  async loadPlugin(manifest: PluginManifest): Promise<PluginLoadResult> {
    const pluginName = manifest.name;
    const reload = this.plugins.has(pluginName);

    const data: PluginLoadData = { status: 'pending', manifest };
    let entryModule: PluginEntryModule;

    if (manifest.registrationMethod === 'callback') {
      data.entryCallbackFired = false;
    }

    this.plugins.set(pluginName, data);

    if (!this.options.canLoadPlugin(manifest, reload)) {
      data.status = 'failed';
      this.invokeLoadListeners();

      return {
        success: false,
        errorMessage: `Plugin ${pluginName} is not allowed to be ${reload ? 'reloaded' : 'loaded'}`,
      };
    }

    try {
      await this.resolvePluginDependencies(manifest);
    } catch (e) {
      data.status = 'failed';
      this.invokeLoadListeners();

      return {
        success: false,
        errorMessage: `Failed to resolve dependencies of plugin ${pluginName}`,
        errorCause: e,
      };
    }

    try {
      await this.loadPluginScripts(manifest, data);
    } catch (e) {
      data.status = 'failed';
      this.invokeLoadListeners();

      return {
        success: false,
        errorMessage: `Failed to load scripts of plugin ${pluginName}`,
        errorCause: e,
      };
    }

    try {
      entryModule = await this.initSharedModules(manifest, data);
    } catch (e) {
      data.status = 'failed';
      this.invokeLoadListeners();

      return {
        success: false,
        errorMessage: `Failed to initialize shared modules of plugin ${pluginName}`,
        errorCause: e,
      };
    }

    data.status = 'loaded';
    this.invokeLoadListeners();

    return { success: true, entryModule };
  }

  /**
   * Load all scripts of the given plugin.
   */
  private async loadPluginScripts(manifest: PluginManifest, data: PluginLoadData) {
    const pluginName = manifest.name;

    const [, rejectedReasons] = await settleAllPromises(
      manifest.loadScripts.map((scriptName) => {
        const scriptID = `${pluginName}/${scriptName}`;
        const scriptElement = getScriptElement(scriptID);

        if (scriptElement && !this.options.canReloadScript(manifest, scriptName)) {
          return Promise.resolve();
        }

        if (scriptElement) {
          scriptElement.remove();
        }

        return injectScriptElement(
          resolveURL(manifest.baseURL, scriptName, (url) => {
            url.searchParams.set('cacheBuster', uuidv4());
            return url;
          }),
          scriptID,
        );
      }),
    );

    if (rejectedReasons.length > 0) {
      throw new ErrorWithCause(
        `Detected ${rejectedReasons.length} errors while loading plugin scripts`,
        rejectedReasons,
      );
    }

    if (manifest.registrationMethod === 'callback' && !data.entryCallbackFired) {
      throw new Error(`Scripts of plugin ${pluginName} loaded without entry callback`);
    }

    if (manifest.registrationMethod === 'callback' && !data.entryCallbackModule) {
      throw new Error(`Entry callback for plugin ${pluginName} called without entry module`);
    }
  }

  /**
   * Initialize the plugin with provided shared modules.
   */
  private async initSharedModules(manifest: PluginManifest, data: PluginLoadData) {
    const pluginName = manifest.name;

    const entryModule =
      manifest.registrationMethod === 'callback'
        ? data.entryCallbackModule
        : this.options.getPluginEntryModule(manifest);

    if (!entryModule) {
      throw new Error(`Failed to retrieve entry module of plugin ${pluginName}`);
    }

    if (typeof entryModule.init !== 'function' || typeof entryModule.get !== 'function') {
      throw new Error(`Entry module of plugin ${pluginName} does not meet expected contract`);
    }

    await Promise.resolve(entryModule.init(this.options.sharedScope));

    return entryModule;
  }

  private getCurrentDependencyResolutions() {
    const resolutions = new Map<string, DependencyResolution>();

    Array.from(this.plugins.entries()).forEach(([pluginName, data]) => {
      if (data.status === 'loaded') {
        resolutions.set(pluginName, { success: true, version: data.manifest.version });
      } else if (data.status === 'failed') {
        resolutions.set(pluginName, { success: false });
      }
    });

    Object.entries(this.options.fixedPluginDependencyResolutions).forEach(([depName, version]) => {
      if (semver.valid(version)) {
        resolutions.set(depName, { success: true, version });
      }
    });

    return resolutions;
  }

  /**
   * Resolve all dependencies of the given plugin.
   *
   * Fail early if there are any unsuccessful or unmet dependency resolutions.
   */
  private resolvePluginDependencies(manifest: PluginManifest) {
    return new Promise<void>((resolve, reject) => {
      const pluginName = manifest.name;
      const dependencies = manifest.dependencies ?? {};
      const semverRangeOptions: semver.RangeOptions = { includePrerelease: true };

      let isResolutionComplete = false;
      let listener: VoidFunction;

      const setResolutionComplete = () => {
        isResolutionComplete = true;
        this.loadListeners.delete(listener);
      };

      const tryResolveDependencies = () => {
        const resolutions = this.getCurrentDependencyResolutions();
        const resolutionErrors: string[] = [];

        Object.entries(dependencies).forEach(([depName, versionRange]) => {
          if (resolutions.has(depName)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const res = resolutions.get(depName)!;

            if (res.success && !semver.satisfies(res.version, versionRange, semverRangeOptions)) {
              resolutionErrors.push(
                `Dependency ${depName} not met: required range ${versionRange}, resolved version ${res.version}`,
              );
            } else if (!res.success) {
              resolutionErrors.push(`Dependency ${depName} could not be resolved successfully`);
            }
          }
        });

        const pendingDepNames = Object.keys(dependencies).filter(
          (depName) => !resolutions.has(depName),
        );

        const pendingDepInfo =
          pendingDepNames.length > 0
            ? `${pendingDepNames.length} pending resolutions (${pendingDepNames.join(',')})`
            : `no pending resolutions`;

        if (resolutionErrors.length > 0) {
          const errorTitle = `Detected ${resolutionErrors.length} resolution errors with ${pendingDepInfo}`;
          setResolutionComplete();
          reject(new Error(`${errorTitle}:\n\n${resolutionErrors.join('\n')}`));
          return;
        }

        consoleLogger.info(`Plugin ${pluginName} has ${pendingDepInfo}`);

        if (pendingDepNames.length === 0) {
          setResolutionComplete();
          resolve();
        }
      };

      tryResolveDependencies();

      if (!isResolutionComplete) {
        listener = tryResolveDependencies;
        this.loadListeners.add(listener);
      }
    });
  }

  private createPluginEntryCallback(): PluginEntryCallback {
    return (pluginName, entryModule) => {
      if (!this.plugins.has(pluginName)) {
        consoleLogger.warn('Received entry callback for unknown plugin');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const data = this.plugins.get(pluginName)!;

      if (data.entryCallbackFired) {
        consoleLogger.warn(`Entry callback for plugin ${pluginName} called more than once`);
        return;
      }

      data.entryCallbackFired = true;
      data.entryCallbackModule = entryModule;
    };
  }

  /**
   * Register the global callback function used by plugin entry scripts.
   *
   * This must be called in order to load plugins using the `callback` registration method.
   */
  registerPluginEntryCallback() {
    const registerCallback = this.options.entryCallbackSettings.registerCallback ?? true;
    const callbackName = this.options.entryCallbackSettings.name ?? DEFAULT_REMOTE_ENTRY_CALLBACK;

    if (!registerCallback) {
      consoleLogger.info(`Plugin entry callback ${callbackName} will not be registered`);
      return;
    }

    if (typeof window[callbackName] === 'function') {
      consoleLogger.warn(`Plugin entry callback ${callbackName} is already registered`);
      return;
    }

    window[callbackName] = this.createPluginEntryCallback();
  }
}
