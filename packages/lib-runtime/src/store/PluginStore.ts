import * as _ from 'lodash-es';
import { Extension, LoadedExtension } from '../types/extension';
import { PluginMetadata, PluginManifest, LoadedPlugin } from '../types/plugin';
import { consoleLogger } from '../utils/logger';
import { PluginLoader } from './PluginLoader';

/**
 * Client interface for `PluginStore` consumers.
 */
export interface PluginStoreClient<TLoadedExtension extends LoadedExtension> {
  subscribe: (listener: VoidFunction, eventTypes: PluginStoreEventType[]) => VoidFunction;
  getExtensions: () => TLoadedExtension[];
  getPluginInfo: () => (LoadedPluginInfo | NotLoadedPluginInfo)[];
}

type LoadedPluginInfo = {
  pluginName: string;
  status: 'loaded';
  metadata: LoadedPlugin['metadata'];
  enabled: boolean;
};

type NotLoadedPluginInfo = {
  pluginName: string;
  status: 'pending' | 'failed';
};

export enum PluginStoreEventType {
  /** Plugin was successfully loaded, processed and added to the `PluginStore`. */
  PluginLoaded = 'PluginLoaded',
  /** Plugin failed to load, or there was an error while processing it. */
  PluginFailedToLoad = 'PluginFailedToLoad',
  /** Plugin was enabled or disabled. Triggers event `ExtensionsChanged`. */
  PluginEnabledOrDisabled = 'PluginEnabledOrDisabled',
  /** The list of extensions which are currently in use has changed. */
  ExtensionsChanged = 'ExtensionsChanged',
}

export type PluginStoreOptions = Partial<{
  /** Automatically enable plugins after adding them to the `PluginStore`? */
  autoEnableLoadedPlugins: boolean;
  /** Post-process loaded extension objects before `PluginLoaded` event. */
  postProcessExtensions: (extensions: LoadedExtension[]) => LoadedExtension[];
}>;

/**
 * Provides access to runtime plugin information and extensions.
 */
export class PluginStore<TLoadedExtension extends LoadedExtension>
  implements PluginStoreClient<TLoadedExtension>
{
  private readonly options: Required<PluginStoreOptions>;

  private loader: PluginLoader | undefined;

  /** Plugins that were successfully loaded and processed. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin<TLoadedExtension>>();

  /** Plugins that failed to load or get processed properly. */
  private readonly failedPlugins = new Set<string>();

  /** Extensions which are currently in use. */
  private extensions: TLoadedExtension[] = [];

  /** Subscribed `PluginStore` event listeners. */
  private readonly listeners = new Map<PluginStoreEventType, Set<VoidFunction>>();

  constructor(options: PluginStoreOptions = {}) {
    this.options = {
      autoEnableLoadedPlugins: options.autoEnableLoadedPlugins ?? true,
      postProcessExtensions: options.postProcessExtensions ?? ((extensions) => extensions),
    };

    Object.values(PluginStoreEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });
  }

  /**
   * Connect this `PluginStore` to the provided `PluginLoader`.
   *
   * This must be done before attempting to load any plugins.
   *
   * Returns a function for disconnecting from the `PluginLoader`.
   */
  setLoader(loader: PluginLoader): VoidFunction {
    if (this.loader !== undefined) {
      throw new Error('PluginLoader has already been set');
    }

    this.loader = loader;

    const unsubscribe = loader.subscribe((pluginName, result) => {
      if (!result.success) {
        this.registerFailedPlugin(pluginName);
        return;
      }

      const pluginAdded = this.addPlugin(
        _.omit<PluginManifest, 'extensions'>(result.manifest, 'extensions'),
        this.processExtensions(pluginName, result.manifest.extensions) as TLoadedExtension[],
      );

      if (pluginAdded && this.options.autoEnableLoadedPlugins) {
        this.setPluginEnabled(pluginName, true);
      }
    });

    return () => {
      unsubscribe();
      this.loader = undefined;
    };
  }

  /**
   * Start loading a plugin from the specified URL.
   *
   * Use the `subscribe` method to respond to relevant `PluginStore` events.
   */
  async loadPlugin(baseURL: string) {
    if (this.loader === undefined) {
      consoleLogger.error(`PluginLoader must be set before loading any plugins`);
      return;
    }

    let manifest: PluginManifest;

    try {
      manifest = await this.loader.getPluginManifest(baseURL);
    } catch (e) {
      consoleLogger.error(`Failed to get a valid plugin manifest from ${baseURL}`, e);
      return;
    }

    try {
      this.loader.loadPluginEntryScript(baseURL, manifest);
    } catch (e) {
      consoleLogger.error(`Failed to start loading a plugin entry script from ${baseURL}`, e);
      this.registerFailedPlugin(manifest.name);
    }
  }

  /**
   * Get all extensions which are currently in use.
   *
   * This method always returns a new array instance.
   */
  getExtensions() {
    return [...this.extensions];
  }

  /**
   * Subscribe to events related to the `PluginStore` operation.
   *
   * Returns a function for unsubscribing the provided listener.
   */
  subscribe(listener: VoidFunction, eventTypes: PluginStoreEventType[]): VoidFunction {
    if (eventTypes.length === 0) {
      consoleLogger.warn('subscribe method called with no eventTypes');
      return _.noop;
    }

    eventTypes.forEach((t) => {
      this.listeners.get(t)?.add(listener);
    });

    let isSubscribed = true;

    return () => {
      if (isSubscribed) {
        isSubscribed = false;

        eventTypes.forEach((t) => {
          this.listeners.get(t)?.delete(listener);
        });
      }
    };
  }

  private invokeListeners(eventTypes: PluginStoreEventType[]) {
    eventTypes.forEach((t) => {
      this.listeners.get(t)?.forEach((listener) => {
        listener();
      });
    });
  }

  /**
   * Add new plugin to the `PluginStore`.
   *
   * Once added, the plugin is disabled by default. Enable it to put its extensions into use.
   *
   * Returns `true` if the plugin was added successfully.
   */
  addPlugin(metadata: PluginMetadata, processedExtensions: TLoadedExtension[]) {
    const pluginName = metadata.name;
    const pluginVersion = metadata.version;

    if (this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(`Attempt to re-add an already loaded plugin ${pluginName}`);
      return false;
    }

    this.loadedPlugins.set(pluginName, {
      metadata: Object.freeze(metadata),
      extensions: processedExtensions.map((e) => Object.freeze(e)),
      enabled: false,
    });

    this.failedPlugins.delete(pluginName);
    this.invokeListeners([PluginStoreEventType.PluginLoaded]);

    consoleLogger.info(`Added plugin ${pluginName} version ${pluginVersion}`);

    return true;
  }

  /**
   * Enable or disable the given plugin.
   *
   * Enabling the plugin puts all of its extensions into use. Disabling it does the opposite.
   */
  setPluginEnabled(pluginName: string, enabled: boolean) {
    if (!this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(
        `Attempt to ${enabled ? 'enable' : 'disable'} plugin ${pluginName} which is not loaded yet`,
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const plugin = this.loadedPlugins.get(pluginName)!;

    if (plugin.enabled !== enabled) {
      plugin.enabled = enabled;

      this.extensions = Array.from(this.loadedPlugins.values()).reduce(
        (acc, p) => (p.enabled ? [...acc, ...p.extensions] : acc),
        [] as TLoadedExtension[],
      );

      this.invokeListeners([
        PluginStoreEventType.PluginEnabledOrDisabled,
        PluginStoreEventType.ExtensionsChanged,
      ]);

      consoleLogger.info(`Plugin ${pluginName} is now ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  registerFailedPlugin(pluginName: string) {
    if (this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(`Attempt to register an already loaded plugin ${pluginName} as failed`);
      return;
    }

    this.failedPlugins.add(pluginName);
    this.invokeListeners([PluginStoreEventType.PluginFailedToLoad]);
  }

  /**
   * Process extension objects as received from the plugin manifest.
   */
  processExtensions(pluginName: string, extensions: Extension[]) {
    const processedExtensions: LoadedExtension[] = extensions.map((e, index) => ({
      ...e,
      pluginName,
      uid: `${pluginName}[${index}]`,
    }));

    // TODO decode EncodedCodeRef values into CodeRef values

    return this.options.postProcessExtensions(processedExtensions);
  }

  /**
   * Get information about plugins managed by this `PluginStore`.
   */
  getPluginInfo() {
    const loadedEntries = Array.from(this.loadedPlugins.keys()).reduce((acc, pluginName) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const plugin = this.loadedPlugins.get(pluginName)!;

      acc.push({
        pluginName,
        status: 'loaded',
        metadata: plugin.metadata,
        enabled: plugin.enabled,
      });

      return acc;
    }, [] as LoadedPluginInfo[]);

    const failedEntries = Array.from(this.failedPlugins.values()).reduce((acc, pluginName) => {
      acc.push({ pluginName, status: 'failed' });
      return acc;
    }, [] as NotLoadedPluginInfo[]);

    const pendingEntries = (this.loader?.getPendingPluginNames() ?? []).reduce(
      (acc, pluginName) => {
        acc.push({ pluginName, status: 'pending' });
        return acc;
      },
      [] as NotLoadedPluginInfo[],
    );

    return [...loadedEntries, ...failedEntries, ...pendingEntries];
  }
}
