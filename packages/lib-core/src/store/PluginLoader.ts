import type { AnyObject, ResourceFetch } from '@monorepo/common';
import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import * as semver from 'semver';
import { PLUGIN_MANIFEST, REMOTE_ENTRY_SCRIPT, REMOTE_ENTRY_CALLBACK } from '../constants';
import type { PluginManifest } from '../types/plugin';
import type { PluginEntryModule, PluginEntryCallback } from '../types/runtime';
import { basicFetch } from '../utils/basic-fetch';
import { resolveURL } from '../utils/url';
import { pluginManifestSchema } from '../yup-schemas';

type PluginLoadData = {
  entryCallbackFired: boolean;
  status: 'pending' | 'loaded' | 'failed';
  manifest: PluginManifest;
};

type PluginLoadResult =
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

type PluginLoadListener = (result: PluginLoadResult) => void;

type DependencyResolution =
  | {
      success: true;
      version: string;
    }
  | {
      success: false;
    };

export type PluginLoaderOptions = Partial<{
  /** Control which plugins can be loaded. */
  canLoadPlugin: (pluginName: string) => boolean;
  /** Name of the global callback function used by plugin entry scripts. */
  entryCallbackName: string;
  /** Custom resource fetch implementation. */
  fetchImpl: ResourceFetch;
  /** Fixed resolutions used when processing plugin dependencies. */
  fixedPluginDependencyResolutions: Record<string, string>;
  /** Shared scope object for initializing `PluginEntryModule` containers. */
  sharedScope: AnyObject;
  /** Post-process the plugin manifest. Can be used as a custom validation hook. */
  postProcessManifest: (manifest: PluginManifest) => Promise<PluginManifest>;
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
      entryCallbackName: options.entryCallbackName ?? REMOTE_ENTRY_CALLBACK,
      fetchImpl: options.fetchImpl ?? basicFetch,
      fixedPluginDependencyResolutions: options.fixedPluginDependencyResolutions ?? {},
      sharedScope: options.sharedScope ?? {},
      postProcessManifest: options.postProcessManifest ?? (async (manifest) => manifest),
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
   * Start loading a plugin from `baseURL`.
   *
   * This involves the following steps:
   * - get plugin manifest
   * - resolve plugin dependencies
   * - load plugin entry script
   *
   * The last step delegates control to the plugin entry script, which is supposed to call
   * the global callback function created via {@link registerPluginEntryCallback} method.
   *
   * Use `subscribe` method to respond to plugin load results.
   */
  async loadPlugin(baseURL: string) {
    let manifest: PluginManifest;

    try {
      manifest = await this.getPluginManifest(baseURL);
    } catch (e) {
      this.invokeListeners({
        success: false,
        errorMessage: `Failed to get a valid plugin manifest from ${baseURL}`,
        errorCause: e,
      });
      return;
    }

    const pluginName = manifest.name;

    if (this.plugins.get(pluginName)?.status === 'pending') {
      consoleLogger.warn(`Attempt to reload plugin ${pluginName} while being loaded`);
      return;
    }

    if (this.plugins.get(pluginName)?.status === 'loaded') {
      consoleLogger.warn(`Attempt to reload plugin ${pluginName} after being loaded`);
      return;
    }

    const data: PluginLoadData = {
      entryCallbackFired: false,
      status: 'pending',
      manifest,
    };

    this.plugins.set(pluginName, data);

    if (!this.options.canLoadPlugin(pluginName)) {
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Plugin ${pluginName} is not allowed to be loaded`,
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
      this.loadPluginEntryScript(baseURL, manifest);
    } catch (e) {
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Failed to start loading entry script of plugin ${pluginName}`,
        errorCause: e,
      });
    }
  }

  /**
   * Fetch the plugin manifest from `baseURL` and validate it.
   */
  async getPluginManifest(baseURL: string) {
    const manifestURL = resolveURL(baseURL, PLUGIN_MANIFEST);

    consoleLogger.info(`Loading plugin manifest from ${manifestURL}`);

    const response = await this.options.fetchImpl(manifestURL);
    const responseText = await response.text();

    let manifest: PluginManifest = await pluginManifestSchema
      .strict(true)
      .validate(JSON.parse(responseText));

    manifest = await this.options.postProcessManifest(manifest);

    return manifest;
  }

  private getDependencyResolutions() {
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
  async resolvePluginDependencies(manifest: PluginManifest) {
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
        const resolutions = this.getDependencyResolutions();
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

  /**
   * Start loading the plugin entry script from `baseURL`.
   */
  loadPluginEntryScript(
    baseURL: string,
    manifest: PluginManifest,
    getDocument: () => typeof document = _.constant(document),
  ) {
    const pluginName = manifest.name;
    const data = this.plugins.get(pluginName);

    if (data?.status !== 'pending') {
      consoleLogger.warn(`Attempt to load entry script of non-pending plugin ${pluginName}`);
      return;
    }

    const script = getDocument().createElement('script');
    const scriptURL = resolveURL(baseURL, REMOTE_ENTRY_SCRIPT);

    script.src = scriptURL;
    script.async = true;

    script.onload = () => {
      if (!data.entryCallbackFired) {
        data.status = 'failed';
        this.invokeListeners({
          success: false,
          pluginName,
          errorMessage: `Entry script of plugin ${pluginName} loaded without callback`,
        });
      }
    };

    script.onerror = (event) => {
      data.status = 'failed';
      this.invokeListeners({
        success: false,
        pluginName,
        errorMessage: `Failed to load entry script of plugin ${pluginName}`,
        errorCause: event,
      });
    };

    consoleLogger.info(`Loading entry script of plugin ${pluginName} from ${scriptURL}`);

    getDocument().head.appendChild(script);
  }

  createPluginEntryCallback(): PluginEntryCallback {
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

      Promise.resolve(entryModule.init(this.options.sharedScope))
        // eslint-disable-next-line promise/always-return -- entryModule.init() returns Promise<void>
        .then(() => {
          data.status = 'loaded';
          this.invokeListeners({
            success: true,
            pluginName,
            manifest: data.manifest,
            entryModule,
          });
        })
        .catch((e) => {
          data.status = 'failed';
          this.invokeListeners({
            success: false,
            pluginName,
            errorMessage: `Failed to initialize shared modules of plugin ${pluginName}`,
            errorCause: e,
          });
        });
    };
  }

  /**
   * Register the global callback function used by plugin entry scripts.
   */
  registerPluginEntryCallback(getWindow: () => typeof window = _.constant(window)) {
    const windowGlobal = getWindow() as unknown as AnyObject;
    const callbackName = this.options.entryCallbackName;

    if (typeof windowGlobal[callbackName] === 'function') {
      consoleLogger.warn(`Plugin callback ${callbackName} is already registered`);
      return;
    }

    windowGlobal[callbackName] = this.createPluginEntryCallback();
  }
}
