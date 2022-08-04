import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import type { Extension, LoadedExtension, CodeRef } from '../types/extension';
import type { PluginRuntimeMetadata, PluginManifest, LoadedPlugin } from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';
import type { PluginInfoEntry, PluginConsumer, PluginManager, FeatureFlags } from '../types/store';
import { PluginEventType } from '../types/store';
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

  /** Feature flags used to determine the availability of extensions. */
  private featureFlags: FeatureFlags = {};

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
        this.setPluginsEnabled([{ pluginName, enabled: true }]);
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

  private invokeListeners(eventType: PluginEventType) {
    this.listeners.get(eventType)?.forEach((listener) => {
      listener();
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

  setPluginsEnabled(config: { pluginName: string; enabled: boolean }[]) {
    let update = false;

    config.forEach(({ pluginName, enabled }) => {
      if (!this.loadedPlugins.has(pluginName)) {
        consoleLogger.warn(
          `Attempt to ${
            enabled ? 'enable' : 'disable'
          } plugin ${pluginName} which is not ready yet`,
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const plugin = this.loadedPlugins.get(pluginName)!;

      if (plugin.enabled !== enabled) {
        plugin.enabled = enabled;
        consoleLogger.info(`Plugin ${pluginName} will be ${enabled ? 'enabled' : 'disabled'}`);
        update = true;
      }
    });

    if (update) {
      this.invokeListeners(PluginEventType.PluginInfoChanged);
      this.updateExtensions();
    }
  }

  updateExtensions() {
    const prevExtensions = this.extensions;

    this.extensions = Array.from(this.loadedPlugins.values()).reduce(
      (acc, p) =>
        p.enabled ? [...acc, ...p.extensions.filter((e) => this.isExtensionInUse(e))] : acc,
      [] as LoadedExtension[],
    );

    if (!_.isEqual(prevExtensions, this.extensions)) {
      this.invokeListeners(PluginEventType.ExtensionsChanged);
    }
  }

  /**
   * Checks whether an extension is in use based on the values of required and disallowed feature flags
   * @param {Extension} extension The extension to check for
   * @returns {boolean} returns `true` if the extension is in use, and `false` if it is not in use
   */
  private isExtensionInUse(extension: Extension) {
    return (
      (extension.flags?.required?.every((f) => this.featureFlags[f] === true) ?? true) &&
      (extension.flags?.disallowed?.every((f) => this.featureFlags[f] === false) ?? true)
    );
  }

  setFeatureFlags(newFlags: FeatureFlags): void {
    const prevFeatureFlags = this.featureFlags;
    const nextFeatureFlags = _.pickBy(newFlags, (value) => typeof value === 'boolean');

    this.featureFlags = { ...this.featureFlags, ...nextFeatureFlags };

    if (!_.isEqual(prevFeatureFlags, this.featureFlags)) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.FeatureFlagsChanged);
    }
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  /**
   * Add new plugin to the {@link PluginStore}.
   *
   * Once added, the plugin is disabled by default. Enable it to put its extensions into use.
   *
   * Returns `true` if the plugin was added successfully.
   */
  addPlugin(metadata: PluginRuntimeMetadata, processedExtensions: LoadedExtension[]) {
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
    this.invokeListeners(PluginEventType.PluginInfoChanged);

    consoleLogger.info(`Added plugin ${pluginName} version ${pluginVersion}`);

    return true;
  }

  registerFailedPlugin(pluginName: string) {
    if (this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(`Attempt to register an already loaded plugin ${pluginName} as failed`);
      return;
    }

    this.failedPlugins.add(pluginName);
    this.invokeListeners(PluginEventType.PluginInfoChanged);
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
