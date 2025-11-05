import { v4 as uuidv4 } from 'uuid';
import type { AnyObject } from '@monorepo/common';
import { consoleLogger, ErrorWithCause } from '@monorepo/common';
import { cloneDeep, identity, noop } from 'lodash';
import * as semver from 'semver';
import { DEFAULT_REMOTE_ENTRY_CALLBACK } from '../constants';
import type { LoadedExtension } from '../types/extension';
import type { ResourceFetch } from '../types/fetch';
import type { PluginLoadResult, PluginLoaderInterface } from '../types/loader';
import type { RemotePluginManifest, PluginManifest } from '../types/plugin';
import type { PluginEntryModule, PluginEntryCallback } from '../types/runtime';
import { basicFetch } from '../utils/basic-fetch';
import { settleAllPromises } from '../utils/promise';
import { injectScriptElement, getScriptElement } from '../utils/scripts';
import { resolveURL } from '../utils/url';
import { remotePluginManifestSchema } from '../yup-schemas';
import { decodeCodeRefs } from './coderefs';

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
   * By default, all plugins are allowed to be loaded and reloaded.
   */
  canLoadPlugin: (manifest: PluginManifest, reload: boolean) => boolean;

  /**
   * Control whether the given plugin script can be reloaded when attempting to reload
   * the associated plugin.
   *
   * By default, all plugin scripts are allowed to be reloaded.
   */
  canReloadScript: (manifest: RemotePluginManifest, scriptName: string) => boolean;

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
   * Transform the plugin manifest before loading the associated plugin.
   *
   * By default, no transformation is performed on the manifest.
   */
  transformPluginManifest: <T extends PluginManifest>(manifest: T) => T;

  /**
   * Provide access to the plugin's entry module.
   *
   * This option applies only to plugins using the `custom` registration method.
   *
   * For example, if a plugin was built with `var` library type (i.e. its entry module is
   * assigned to a global variable), you can access the entry module as `window[pluginName]`.
   *
   * By default, this function does nothing.
   */
  getPluginEntryModule: (manifest: RemotePluginManifest) => PluginEntryModule | void;
}>;

/**
 * Loads plugin assets from remote sources.
 */
export class PluginLoader implements PluginLoaderInterface {
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
      transformPluginManifest: options.transformPluginManifest ?? identity,
      getPluginEntryModule: options.getPluginEntryModule ?? noop,
    };

    this.registerPluginEntryCallback();
  }

  private invokeLoadListeners() {
    this.loadListeners.forEach((listener) => {
      listener();
    });
  }

  async loadPluginManifest(manifestURL: string) {
    const response = await this.options.fetchImpl(manifestURL, { cache: 'no-cache' });
    const manifest = JSON.parse(await response.text());

    remotePluginManifestSchema.validateSync(manifest, { strict: true, abortEarly: false });

    return manifest as RemotePluginManifest;
  }

  transformPluginManifest<T extends PluginManifest>(manifest: T) {
    return this.options.transformPluginManifest(manifest);
  }

  /**
   * @remarks
   *
   * In order to load plugins using the `callback` registration method, the host application
   * must register a global entry callback function to be called by the plugin's entry script.
   * This function should be called with two arguments: plugin name and entry module object.
   *
   * In order to load plugins using the `custom` registration method, the host application must
   * provide a way to retrieve the entry module that was loaded by the plugin's entry script.
   * If not implemented properly, plugins using this registration method will fail to load.
   *
   * For plugins loaded from a local plugin manifest, the `entryModule` will be `undefined`.
   *
   * @see {@link PluginLoaderOptions.entryCallbackSettings}
   * @see {@link PluginLoaderOptions.getPluginEntryModule}
   */
  async loadPlugin(manifest: PluginManifest): Promise<PluginLoadResult> {
    const pluginName = manifest.name;
    const reload = this.plugins.has(pluginName);

    const data: PluginLoadData = { status: 'pending', manifest };
    let entryModule: PluginEntryModule | undefined;

    const isRemoteManifest =
      manifest.registrationMethod === 'callback' || manifest.registrationMethod === 'custom';

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
      if (isRemoteManifest) {
        await this.loadPluginScripts(manifest, data);
      }
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
      if (isRemoteManifest) {
        entryModule = await this.initSharedModules(manifest, data);
      }
    } catch (e) {
      data.status = 'failed';
      this.invokeLoadListeners();

      return {
        success: false,
        errorMessage: `Failed to initialize shared modules of plugin ${pluginName}`,
        errorCause: e,
      };
    }

    const pluginBuildHash = isRemoteManifest ? manifest.buildHash ?? uuidv4() : uuidv4();

    let loadedExtensions = cloneDeep(manifest.extensions).map<LoadedExtension>((e, index) => ({
      ...e,
      pluginName,
      uid: `${pluginName}[${index}]_${pluginBuildHash}`,
    }));

    if (isRemoteManifest) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      loadedExtensions = loadedExtensions.map((e) => decodeCodeRefs(e, entryModule!));
    }

    data.status = 'loaded';
    this.invokeLoadListeners();

    return { success: true, loadedExtensions, entryModule };
  }

  /**
   * Load all scripts of the given plugin.
   */
  private async loadPluginScripts(manifest: RemotePluginManifest, data: PluginLoadData) {
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

        const scriptURL = resolveURL(manifest.baseURL, scriptName, (url) => {
          url.searchParams.set('cacheBuster', uuidv4());
          return url;
        });

        return injectScriptElement(scriptURL, scriptID);
      }),
    );

    if (rejectedReasons.length > 0) {
      throw new ErrorWithCause('Detected errors while loading scripts', rejectedReasons);
    }

    if (manifest.registrationMethod === 'callback' && !data.entryCallbackFired) {
      throw new Error('Scripts loaded without a plugin entry callback');
    }

    if (manifest.registrationMethod === 'callback' && !data.entryCallbackModule) {
      throw new Error('Plugin entry callback called without an entry module');
    }
  }

  /**
   * Initialize the plugin with provided shared modules.
   */
  private async initSharedModules(manifest: RemotePluginManifest, data: PluginLoadData) {
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
      const requiredDependencies = manifest.dependencies ?? {};
      const optionalDependencies = manifest.optionalDependencies ?? {};
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
        const pendingDepNames: string[] = [];

        Object.entries({ ...optionalDependencies, ...requiredDependencies }).forEach(
          ([depName, versionRange]) => {
            if (resolutions.has(depName)) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const res = resolutions.get(depName)!;
              const isRequired = !!requiredDependencies[depName];

              if (res.success && !semver.satisfies(res.version, versionRange, semverRangeOptions)) {
                resolutionErrors.push(
                  `Dependency ${depName} not met: required range ${versionRange}, resolved version ${res.version}`,
                );
              } else if (!res.success && isRequired) {
                resolutionErrors.push(`Dependency ${depName} could not be resolved successfully`);
              }
            } else {
              pendingDepNames.push(depName);
            }
          },
        );

        if (resolutionErrors.length > 0) {
          setResolutionComplete();
          reject(
            new Error(`Detected dependency resolution errors: [${resolutionErrors.join('; ')}]`),
          );
          return;
        }

        if (pendingDepNames.length === 0) {
          setResolutionComplete();
          resolve();
        } else {
          consoleLogger.info(
            `Plugin ${pluginName} has ${pendingDepNames.length} pending dependency resolutions`,
          );
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
        consoleLogger.warn(`Received entry callback for unknown plugin ${pluginName}`);
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
      return;
    }

    if (typeof window[callbackName] === 'function') {
      consoleLogger.warn(`Plugin entry callback ${callbackName} is already registered`);
      return;
    }

    window[callbackName] = this.createPluginEntryCallback();

    consoleLogger.info(`Plugin entry callback ${callbackName} has been registered`);
  }
}
