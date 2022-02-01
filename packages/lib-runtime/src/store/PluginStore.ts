import * as _ from 'lodash-es';
import type { Extension, LoadedExtension, CodeRef } from '../types/extension';
import type { PluginMetadata, PluginManifest, LoadedPlugin } from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';
import type { PluginInfoEntry, PluginConsumer, PluginManager } from '../types/store';
import { PluginEventType } from '../types/store';
import { consoleLogger } from '../utils/logger';
import { decodeCodeRefs } from './coderefs';
import type { PluginLoader } from './PluginLoader';

export type PluginStoreOptions = Partial<{
  /** Automatically enable plugins after adding them to the {@link PluginStore}? */
  autoEnableLoadedPlugins: boolean;
  /** Post-process loaded extension objects before adding associated plugin to the {@link PluginStore}. */
  postProcessExtensions: (extensions: LoadedExtension[]) => LoadedExtension[];
}>;

/**
 * Manages plugins and their extensions.
 */
export class PluginStore implements PluginConsumer, PluginManager {
  private readonly options: Required<PluginStoreOptions>;

  private loader: PluginLoader | undefined;

  private readonly codeRefCache = new Map<string, CodeRef>();

  /** Plugins that were successfully loaded and processed. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin>();

  /** Plugins that failed to load or get processed properly. */
  private readonly failedPlugins = new Set<string>();

  /** Extensions which are currently in use. */
  private extensions: LoadedExtension[] = [];

  /** Subscribed event listeners. */
  private readonly listeners = new Map<PluginEventType, Set<VoidFunction>>();

  constructor(options: PluginStoreOptions = {}) {
    this.options = {
      autoEnableLoadedPlugins: options.autoEnableLoadedPlugins ?? true,
      postProcessExtensions: options.postProcessExtensions ?? _.identity,
    };

    Object.values(PluginEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });
  }

  /**
   * Connect this {@link PluginStore} to the provided {@link PluginLoader}.
   *
   * This must be done before attempting to load any plugins.
   *
   * Returns a function for disconnecting from the {@link PluginLoader}.
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
        this.processExtensions(pluginName, result.manifest.extensions, result.entryModule),
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
   * Returns `true` if this {@link PluginStore} is connected to a {@link PluginLoader}.
   */
  hasLoader() {
    return this.loader !== undefined;
  }

  subscribe(eventTypes: PluginEventType[], listener: VoidFunction): VoidFunction {
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

  private invokeListeners(eventTypes: PluginEventType[]) {
    eventTypes.forEach((t) => {
      this.listeners.get(t)?.forEach((listener) => {
        listener();
      });
    });
  }

  getExtensions() {
    return [...this.extensions];
  }

  getPluginInfo() {
    const loadedEntries = Array.from(this.loadedPlugins.values()).reduce((acc, plugin) => {
      acc.push({
        pluginName: plugin.metadata.name,
        status: 'loaded',
        metadata: plugin.metadata,
        enabled: plugin.enabled,
      });
      return acc;
    }, [] as PluginInfoEntry[]);

    const failedEntries = Array.from(this.failedPlugins.values()).reduce((acc, pluginName) => {
      acc.push({ pluginName, status: 'failed' });
      return acc;
    }, [] as PluginInfoEntry[]);

    const pendingEntries = (this.loader?.getPendingPluginNames() ?? []).reduce(
      (acc, pluginName) => {
        acc.push({ pluginName, status: 'pending' });
        return acc;
      },
      [] as PluginInfoEntry[],
    );

    return [...loadedEntries, ...failedEntries, ...pendingEntries];
  }

  async loadPlugin(baseURL: string) {
    if (this.loader === undefined) {
      consoleLogger.error('PluginLoader must be set before loading any plugins');
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
      consoleLogger.error(`Failed to start loading plugin entry script from ${baseURL}`, e);
      this.registerFailedPlugin(manifest.name);
    }
  }

  setPluginEnabled(pluginName: string, enabled: boolean) {
    if (!this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(
        `Attempt to ${enabled ? 'enable' : 'disable'} plugin ${pluginName} which is not ready yet`,
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const plugin = this.loadedPlugins.get(pluginName)!;

    if (plugin.enabled !== enabled) {
      plugin.enabled = enabled;

      this.extensions = Array.from(this.loadedPlugins.values()).reduce(
        (acc, p) => (p.enabled ? [...acc, ...p.extensions] : acc),
        [] as LoadedExtension[],
      );

      this.invokeListeners([PluginEventType.PluginInfoChanged, PluginEventType.ExtensionsChanged]);

      consoleLogger.info(`Plugin ${pluginName} is now ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Add new plugin to the {@link PluginStore}.
   *
   * Once added, the plugin is disabled by default. Enable it to put its extensions into use.
   *
   * Returns `true` if the plugin was added successfully.
   */
  addPlugin(metadata: PluginMetadata, processedExtensions: LoadedExtension[]) {
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
    this.invokeListeners([PluginEventType.PluginInfoChanged]);

    consoleLogger.info(`Added plugin ${pluginName} version ${pluginVersion}`);

    return true;
  }

  registerFailedPlugin(pluginName: string) {
    if (this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(`Attempt to register an already loaded plugin ${pluginName} as failed`);
      return;
    }

    this.failedPlugins.add(pluginName);
    this.invokeListeners([PluginEventType.PluginInfoChanged]);
  }

  /**
   * Process extension objects as received from the plugin manifest.
   */
  processExtensions(pluginName: string, extensions: Extension[], entryModule: PluginEntryModule) {
    const processedExtensions: LoadedExtension[] = extensions.map((e, index) =>
      decodeCodeRefs(
        {
          ...e,
          pluginName,
          uid: `${pluginName}[${index}]`,
        },
        entryModule,
        this.codeRefCache,
      ),
    );

    return this.options.postProcessExtensions(processedExtensions);
  }
}
