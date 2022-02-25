import type { AnyObject, ResourceFetch } from '@monorepo/common';
import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import type { PluginRuntimeManifest } from '../types/plugin';
import type { PluginEntryModule, PluginEntryCallback } from '../types/runtime';
import { basicFetch } from '../utils/basic-fetch';
import { resolveURL } from '../utils/url';
import { pluginRuntimeManifestSchema } from '../yup-schemas';

type PluginLoadData = {
  entryCallbackFired: boolean;
  status: 'pending' | 'loaded' | 'failed';
  manifest: PluginRuntimeManifest;
};

type PluginLoadResult =
  | {
      success: true;
      manifest: PluginRuntimeManifest;
      entryModule: PluginEntryModule;
    }
  | {
      success: false;
    };

type PluginLoadListener = (pluginName: string, result: PluginLoadResult) => void;

export const pluginManifestFile = 'plugin-manifest.json';
export const remoteEntryScript = 'plugin-entry.js';
export const remoteEntryCallback = '__load_plugin_entry__';

export type PluginLoaderOptions = Partial<{
  /** Control which plugins can be loaded. */
  canLoadPlugin: (pluginName: string) => boolean;
  /** Custom resource fetch implementation. */
  fetchImpl: ResourceFetch;
  /** Get shared scope object for initializing `PluginEntryModule` containers. */
  getSharedScope: () => AnyObject;
  /** Post-process the plugin manifest. Can be used as a custom validation hook. */
  postProcessManifest: (manifest: PluginRuntimeManifest) => Promise<PluginRuntimeManifest>;
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

  /** Reference to the global callback function. */
  private entryCallback: PluginEntryCallback | undefined;

  constructor(options: PluginLoaderOptions = {}) {
    this.options = {
      canLoadPlugin: options.canLoadPlugin ?? (() => true),
      fetchImpl: options.fetchImpl ?? basicFetch,
      getSharedScope: options.getSharedScope ?? _.constant({}),
      postProcessManifest: options.postProcessManifest ?? (async (manifest) => manifest),
    };
  }

  /**
   * Subscribe to plugin load events.
   *
   * Returns a function for unsubscribing the provided listener.
   */
  subscribe(listener: PluginLoadListener) {
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
   * Fetch the manifest from a plugin's `baseURL` and validate it.
   */
  async getPluginManifest(baseURL: string) {
    const manifestURL = resolveURL(baseURL, pluginManifestFile);

    consoleLogger.info(`Loading plugin manifest from ${manifestURL}`);

    const response = await this.options.fetchImpl(manifestURL);
    const responseText = await response.text();

    let manifest: PluginRuntimeManifest = await pluginRuntimeManifestSchema
      .strict(true)
      .validate(JSON.parse(responseText));

    manifest = await this.options.postProcessManifest(manifest);

    return manifest;
  }

  /**
   * Start loading the entry script from a plugin's `baseURL` in the application's document.
   */
  loadPluginEntryScript(
    baseURL: string,
    manifest: PluginRuntimeManifest,
    getDocument: () => typeof document = _.constant(document),
  ) {
    const pluginName = manifest.name;
    const scriptURL = resolveURL(baseURL, remoteEntryScript);

    if (this.entryCallback === undefined) {
      throw new Error(`Attempt to load plugin ${pluginName} before registering entry callback`);
    }

    if (!this.options.canLoadPlugin(pluginName)) {
      throw new Error(`Loading plugin ${pluginName} is not allowed`);
    }

    if (this.plugins.get(pluginName)?.status === 'pending') {
      throw new Error(`Reloading plugin ${pluginName} while being loaded is not allowed`);
    }

    if (this.plugins.get(pluginName)?.status === 'loaded') {
      throw new Error(`Reloading plugin ${pluginName} after being loaded is not allowed`);
    }

    const data: PluginLoadData = {
      entryCallbackFired: false,
      status: 'pending',
      manifest,
    };

    this.plugins.set(pluginName, data);

    const script = getDocument().createElement('script');
    script.src = scriptURL;
    script.async = true;

    script.onload = () => {
      if (!data.entryCallbackFired) {
        data.status = 'failed';
        consoleLogger.error(`Entry script for plugin ${pluginName} loaded without callback`);
        this.invokeListeners(pluginName, { success: false });
      }
    };

    script.onerror = (event) => {
      data.status = 'failed';
      consoleLogger.error(`Failed to load entry script for plugin ${pluginName}`, event);
      this.invokeListeners(pluginName, { success: false });
    };

    consoleLogger.info(`Loading entry script for plugin ${pluginName} from ${scriptURL}`);

    getDocument().head.appendChild(script);
  }

  createPluginEntryCallback(): PluginEntryCallback {
    return (pluginName, entryModule) => {
      if (!this.plugins.has(pluginName)) {
        consoleLogger.error(`Received entry callback for unknown plugin ${pluginName}`);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const data = this.plugins.get(pluginName)!;

      if (data.entryCallbackFired) {
        consoleLogger.warn(`Entry callback for plugin ${pluginName} called more than once`);
        return;
      }

      data.entryCallbackFired = true;

      entryModule
        .init(this.options.getSharedScope())
        // eslint-disable-next-line promise/always-return -- entryModule.init() returns Promise<void>
        .then(() => {
          data.status = 'loaded';
          consoleLogger.info(`Entry script for plugin ${pluginName} loaded successfully`);
          this.invokeListeners(pluginName, { success: true, manifest: data.manifest, entryModule });
        })
        .catch((e) => {
          data.status = 'failed';
          consoleLogger.error(`Failed to initialize shared modules for plugin ${pluginName}`, e);
          this.invokeListeners(pluginName, { success: false });
        });
    };
  }

  /**
   * Register the global function used by plugin entry scripts.
   */
  registerPluginEntryCallback(getWindow: () => typeof window = _.constant(window)) {
    const windowGlobal = getWindow() as unknown as AnyObject;
    const callbackName = remoteEntryCallback;

    if (this.entryCallback !== undefined) {
      throw new Error(`Global function ${callbackName} is already registered by this loader`);
    }

    if (typeof windowGlobal[callbackName] === 'function') {
      throw new Error(`Global function ${callbackName} is already registered by another loader`);
    }

    this.entryCallback = this.createPluginEntryCallback();
    windowGlobal[callbackName] = this.entryCallback;
  }

  getPendingPluginNames() {
    return Array.from(this.plugins.entries()).reduce(
      (acc, [pluginName, plugin]) => (plugin.status === 'pending' ? [...acc, pluginName] : acc),
      [] as string[],
    );
  }
}
