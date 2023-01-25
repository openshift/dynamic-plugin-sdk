import { v4 as uuidv4 } from 'uuid';
import type { AnyObject } from '@monorepo/common';
import { consoleLogger, ErrorWithCause } from '@monorepo/common';
import * as _ from 'lodash-es';
import * as semver from 'semver';
import { DEFAULT_PLUGIN_MANIFEST, DEFAULT_REMOTE_ENTRY_CALLBACK } from '../constants';
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

export type PluginLoadResult =
  | {
      success: true;
      pluginName: string;
      manifest: PluginManifest;
      entryModule: PluginEntryModule;
    }
  | {
      success: false;
      pluginName?: string;
      errorMessage: string;
      errorCause?: unknown;
    };

export type PluginLoadListener = (result: PluginLoadResult) => void;

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
   * The `reload` argument indicates whether an already loaded plugin is
   * to be reloaded, assuming there was a change in the plugin manifest.
   *
   * By default, all plugins are allowed to be loaded.
   */
  canLoadPlugin: (manifest: PluginManifest, reload: boolean) => boolean;

  /**
   * Control whether the given plugin script can be reloaded when attempting
   * to reload the associated plugin.
   *
   * By default, all plugin scripts are allowed to be reloaded.
   */
  canReloadScript: (manifest: PluginManifest, scriptName: string) => boolean;

  /**
   * Name of the global callback function used by plugin entry scripts.
   *
   * Applies only to plugins using the `callback` registration method.
   *
   * Default value: `__load_plugin_entry__`.
   */
  entryCallbackName: string;

  /**
   * Custom resource fetch implementation.
   *
   * The custom implementation may specify any host application or environment
   * specific request headers that are necessary to fetch plugin resources over
   * the network.
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
   * Shared scope object for initializing `PluginEntryModule` containers.
   *
   * Host applications built with webpack should use dedicated webpack specific APIs
   * such as `__webpack_init_sharing__` and `__webpack_share_scopes__`.
   *
   * Default value: empty object.
   *
   * @see https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
   */
  sharedScope: AnyObject;

  /**
   * Post-process the plugin manifest when fetched over the network.
   *
   * By default, no post-processing is performed on the manifest.
   */
  postProcessManifest: (manifest: PluginManifest) => PluginManifest;

  /**
   * Provide access to the plugin's entry module.
   *
   * Applies only to plugins using the `custom` registration method.
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

  /** Subscribed event listeners. */
  private readonly listeners = new Set<PluginLoadListener>();

  constructor(options: PluginLoaderOptions = {}) {
    this.options = {
      canLoadPlugin: options.canLoadPlugin ?? (() => true),
      canReloadScript: options.canReloadScript ?? (() => true),
      fetchImpl: options.fetchImpl ?? basicFetch,
      fixedPluginDependencyResolutions: options.fixedPluginDependencyResolutions ?? {},
      sharedScope: options.sharedScope ?? {},
      postProcessManifest: options.postProcessManifest ?? _.identity,
      entryCallbackName: options.entryCallbackName ?? DEFAULT_REMOTE_ENTRY_CALLBACK,
      getPluginEntryModule: options.getPluginEntryModule ?? _.noop,
    };
  }

  /**
   * Subscribe to plugin load events.
   *
   * Returns a function for unsubscribing the provided listener.
   */
  subscribe(listener: PluginLoadListener): VoidFunction {
    this.listeners.add(listener);

    let isSubscribed = true;

    return () => {
      if (isSubscribed) {
        isSubscribed = false;

        this.listeners.delete(listener);
      }
    };
  }

  private invokeListeners(...args: Parameters<PluginLoadListener>) {
    this.listeners.forEach((listener) => {
      listener(...args);
    });
  }

  /**
   * Load a plugin from the given URL.
   *
   * This involves the following asynchronous operations:
   * - load plugin manifest (unless provided as an object)
   * - resolve plugin dependencies
   * - load plugin scripts
   *
   * Plugins using the `callback` registration method are expected to call the global entry
   * callback function created via {@link registerPluginEntryCallback} method, passing two
   * arguments: plugin name and the entry module.
   *
   * For plugins using the `custom` registration method, the `getPluginEntryModule` function
   * is expected to return the entry module of the given plugin. If not implemented properly,
   * plugins using the `custom` registration method will fail to load.
   *
   * Use `subscribe` method to respond to plugin load results.
   */
  async loadPlugin(
    baseURL: string,
    manifestNameOrObject: string | PluginManifest = DEFAULT_PLUGIN_MANIFEST,
  ) {
    let manifest: PluginManifest;

    try {
      manifest =
        typeof manifestNameOrObject === 'string'
          ? await this.loadPluginManifest(resolveURL(baseURL, manifestNameOrObject))
          : manifestNameOrObject;
    } catch (e) {
      this.invokeListeners({
        success: false,
        errorMessage: 'Failed to load plugin manifest',
        errorCause: e,
      });
      return;
    }

    try {
      manifest = pluginManifestSchema.strict(true).validateSync(manifest, { abortEarly: false });
    } catch (e) {
      this.invokeListeners({
        success: false,
        pluginName: typeof manifest?.name === 'string' ? manifest.name : undefined,
        errorMessage: 'Failed to validate plugin manifest',
        errorCause: e,
      });
      return;
    }

    const pluginName = manifest.name;
    const reload = this.plugins.has(pluginName);

    if (this.plugins.get(pluginName)?.status === 'pending') {
      consoleLogger.warn(`Attempt to reload plugin ${pluginName} which has not finished loading`);
      return;
    }

    if (
      reload &&
      this.plugins.get(pluginName)?.status === 'loaded' &&
      _.isEqual(manifest.buildHash, this.plugins.get(pluginName)?.manifest.buildHash)
    ) {
      consoleLogger.warn(`Attempt to reload plugin ${pluginName} with same build hash`);
      return;
    }

    const data: PluginLoadData = { status: 'pending', manifest };

    if (manifest.registrationMethod === 'callback') {
      data.entryCallbackFired = false;
    }

    this.plugins.set(pluginName, data);

    if (!this.options.canLoadPlugin(manifest, reload)) {
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Plugin ${pluginName} is not allowed to be ${reload ? 'reloaded' : 'loaded'}`,
      });
      return;
    }

    try {
      await this.resolvePluginDependencies(manifest);
    } catch (e) {
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Failed to resolve dependencies of plugin ${pluginName}`,
        errorCause: e,
      });
      return;
    }

    try {
      await this.loadPluginScripts(baseURL, manifest, data);
    } catch (e) {
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Failed to load scripts of plugin ${pluginName}`,
        errorCause: e,
      });
    }
  }

  /**
   * Load plugin manifest from the given URL.
   */
  private async loadPluginManifest(manifestURL: string) {
    const response = await this.options.fetchImpl(manifestURL, { cache: 'no-cache' });
    const responseText = await response.text();

    return this.options.postProcessManifest(JSON.parse(responseText));
  }

  /**
   * Load plugin scripts from the given URL.
   */
  private async loadPluginScripts(baseURL: string, manifest: PluginManifest, data: PluginLoadData) {
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
          resolveURL(baseURL, scriptName, (url) => {
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
      // eslint-disable-next-line no-param-reassign
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Scripts of plugin ${pluginName} loaded without entry callback`,
      });
      return;
    }

    if (manifest.registrationMethod === 'callback' && !data.entryCallbackModule) {
      // eslint-disable-next-line no-param-reassign
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Entry callback for plugin ${pluginName} called without entry module`,
      });
      return;
    }

    const entryModule =
      manifest.registrationMethod === 'callback'
        ? data.entryCallbackModule
        : this.options.getPluginEntryModule(manifest);

    if (entryModule) {
      await this.processPlugin(data, entryModule);
    } else {
      // eslint-disable-next-line no-param-reassign
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Failed to retrieve entry module of plugin ${pluginName}`,
      });
    }
  }

  private processPlugin = async (data: PluginLoadData, entryModule: PluginEntryModule) => {
    const { manifest } = data;
    const pluginName = manifest.name;

    if (typeof entryModule.init !== 'function' || typeof entryModule.get !== 'function') {
      // eslint-disable-next-line no-param-reassign
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Entry module of plugin ${pluginName} does not meet expected contract`,
      });
      return;
    }

    try {
      await Promise.resolve(entryModule.init(this.options.sharedScope));
    } catch (e) {
      // eslint-disable-next-line no-param-reassign
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Failed to initialize shared modules of plugin ${pluginName}`,
        errorCause: e,
      });
      return;
    }

    // eslint-disable-next-line no-param-reassign
    data.status = 'loaded';
    this.invokeListeners({
      success: true,
      pluginName,
      manifest,
      entryModule,
    });
  };

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
   * Resolve dependencies of the given plugin.
   *
   * Fail early if there are any unsuccessful or unmet dependency resolutions.
   */
  private async resolvePluginDependencies(manifest: PluginManifest) {
    return new Promise<void>((resolve, reject) => {
      const pluginName = manifest.name;
      const dependencies = manifest.dependencies ?? {};
      const semverRangeOptions: semver.RangeOptions = { includePrerelease: true };

      let unsubscribe: VoidFunction = _.noop;
      let isResolutionComplete = false;

      const resolvePromise = () => {
        isResolutionComplete = true;
        unsubscribe();
        resolve();
      };

      const rejectPromise = (reason?: unknown) => {
        isResolutionComplete = true;
        unsubscribe();
        reject(reason);
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
          rejectPromise(new Error(`${errorTitle}:\n\n${resolutionErrors.join('\n')}`));
          return;
        }

        consoleLogger.info(`Plugin ${pluginName} has ${pendingDepInfo}`);

        if (pendingDepNames.length === 0) {
          resolvePromise();
        }
      };

      tryResolveDependencies();

      if (!isResolutionComplete) {
        unsubscribe = this.subscribe(() => {
          tryResolveDependencies();
        });
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
    const callbackName = this.options.entryCallbackName;

    if (typeof window[callbackName] === 'function') {
      consoleLogger.warn(`Plugin entry callback ${callbackName} is already registered`);
      return;
    }

    window[callbackName] = this.createPluginEntryCallback();
  }
}
