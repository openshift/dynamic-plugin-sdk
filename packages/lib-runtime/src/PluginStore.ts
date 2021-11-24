import * as _ from 'lodash-es';
import { PluginLoader } from './PluginLoader';
import { Extension, LoadedExtension } from './types/extension';
import { PluginMetadata, PluginManifest, LoadedPlugin } from './types/plugin';
import { consoleLogger } from './utils/logger';

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
  /** Plugin was enabled or disabled. Triggers event `ExtensionsInUseChanged`. */
  PluginEnabledOrDisabled = 'PluginEnabledOrDisabled',
  /** The list of extensions which are currently in use has changed. */
  ExtensionsInUseChanged = 'ExtensionsInUseChanged',
}

type PluginStoreOptions = Partial<{
  /** Automatically enable plugins after adding them to the `PluginStore`? */
  autoEnableLoadedPlugins: boolean;
  /** Post-process loaded extension objects before `PluginLoaded` event. */
  postProcessExtensions: (extensions: LoadedExtension[]) => LoadedExtension[];
}>;

/**
 * Provides access to runtime plugin information and extensions.
 */
export class PluginStore<TLoadedExtension extends LoadedExtension> {
  private readonly options: Required<PluginStoreOptions>;

  /** Plugins that were successfully loaded and processed. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin<TLoadedExtension>>();

  /** Plugins that failed to load or get processed properly. */
  private readonly failedPlugins = new Set<string>();

  /** Extensions which are currently in use. */
  private extensionsInUse: TLoadedExtension[] = [];

  /** Subscribed `PluginStore` event listeners. */
  private readonly listeners = new Map<PluginStoreEventType, Set<VoidFunction>>();

  constructor(private readonly loader: PluginLoader, options: PluginStoreOptions = {}) {
    this.options = {
      autoEnableLoadedPlugins: options.autoEnableLoadedPlugins ?? true,
      postProcessExtensions: options.postProcessExtensions ?? ((extensions) => extensions),
    };

    Object.values(PluginStoreEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });
  }

  /**
   * Connect this `PluginStore` with the provided `PluginLoader`.
   */
  init() {
    return this.loader.subscribe((pluginName, result) => {
      if (!result.success) {
        this.registerFailedPlugin(pluginName);
        return;
      }

      this.addPlugin(
        _.omit<PluginManifest, 'extensions'>(result.manifest, 'extensions'),
        this.processExtensions(pluginName, result.manifest.extensions) as TLoadedExtension[],
      );

      if (this.options.autoEnableLoadedPlugins) {
        this.setPluginEnabled(pluginName, true);
      }
    });
  }

  /**
   * Start loading a plugin from the specified URL.
   */
  async loadPlugin(baseURL: string) {
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
  getExtensionsInUse() {
    return [...this.extensionsInUse];
  }

  /**
   * Subscribe to events related to the `PluginStore` operation.
   *
   * Returns a function for unsubscribing the provided listener.
   */
  subscribe(listener: VoidFunction, eventTypes: PluginStoreEventType[]): VoidFunction {
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
   */
  addPlugin(metadata: PluginMetadata, processedExtensions: TLoadedExtension[]) {
    const pluginName = metadata.name;
    const pluginVersion = metadata.version;

    if (this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(`Attempt to re-add an already loaded plugin ${pluginName}`);
      return;
    }

    this.loadedPlugins.set(pluginName, {
      metadata: Object.freeze(metadata),
      extensions: processedExtensions.map((e) => Object.freeze(e)),
      enabled: false,
    });

    this.failedPlugins.delete(pluginName);
    this.invokeListeners([PluginStoreEventType.PluginLoaded]);

    consoleLogger.info(`Added plugin ${pluginName} version ${pluginVersion}`);
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

      this.extensionsInUse = Array.from(this.loadedPlugins.values()).reduce(
        (acc, p) => (p.enabled ? [...acc, ...p.extensions] : acc),
        [] as TLoadedExtension[],
      );

      this.invokeListeners([
        PluginStoreEventType.PluginEnabledOrDisabled,
        PluginStoreEventType.ExtensionsInUseChanged,
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

  processExtensions(pluginName: string, extensions: Extension[]) {
    const processedExtensions: LoadedExtension[] = extensions.map((e, index) => ({
      ...e,
      pluginName,
      uid: `${pluginName}[${index}]`,
    }));

    // TODO decode EncodedCodeRef properties

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

    const pendingEntries = this.loader.getPendingPluginNames().reduce((acc, pluginName) => {
      acc.push({ pluginName, status: 'pending' });
      return acc;
    }, [] as NotLoadedPluginInfo[]);

    return [...loadedEntries, ...failedEntries, ...pendingEntries];
  }
}
