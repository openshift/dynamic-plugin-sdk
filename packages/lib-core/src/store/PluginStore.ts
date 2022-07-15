import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import type { Extension, LoadedExtension, CodeRef } from '../types/extension';
import type {
  PluginRuntimeMetadata,
  PluginManifest,
  LoadedPlugin,
  FailedPlugin,
} from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';
import type { PluginInfoEntry, PluginStoreInterface, FeatureFlags } from '../types/store';
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
export class PluginStore implements PluginStoreInterface {
  private readonly options: Required<PluginStoreOptions>;

  private loader: PluginLoader | undefined;

  private readonly codeRefCache = new Map<string, CodeRef>();

  /** Plugins that were successfully loaded and processed. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin>();

  /** Plugins that failed to load or get processed properly. */
  private readonly failedPlugins = new Map<string, FailedPlugin>();

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

    const unsubscribe = loader.subscribe((result) => {
      if (!result.success) {
        if (result.errorCause) {
          consoleLogger.error(result.errorMessage, result.errorCause);
        } else {
          consoleLogger.error(result.errorMessage);
        }

        if (result.pluginName) {
          this.registerFailedPlugin(result.pluginName, result.errorMessage, result.errorCause);
        }

        return;
      }

      const pluginAdded = this.addPlugin(
        _.omit<PluginManifest, 'extensions'>(result.manifest, 'extensions'),
        this.processExtensions(result.pluginName, result.manifest.extensions, result.entryModule),
      );

      if (pluginAdded && this.options.autoEnableLoadedPlugins) {
        this.enablePlugins([result.pluginName]);
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
    const entries: PluginInfoEntry[] = [];

    Array.from(this.loadedPlugins.entries()).forEach(([pluginName, plugin]) => {
      entries.push({
        pluginName,
        status: 'loaded',
        metadata: plugin.metadata,
        enabled: plugin.enabled,
        disableReason: plugin.disableReason,
      });
    });

    Array.from(this.failedPlugins.entries()).forEach(([pluginName, plugin]) => {
      entries.push({
        pluginName,
        status: 'failed',
        errorMessage: plugin.errorMessage,
        errorCause: plugin.errorCause,
      });
    });

    return entries;
  }

  setFeatureFlags(newFlags: FeatureFlags) {
    const prevFeatureFlags = this.featureFlags;

    this.featureFlags = {
      ...this.featureFlags,
      ..._.pickBy(newFlags, (value) => typeof value === 'boolean'),
    };

    if (!_.isEqual(prevFeatureFlags, this.featureFlags)) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.FeatureFlagsChanged);
    }
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  async loadPlugin(baseURL: string) {
    if (this.loader === undefined) {
      consoleLogger.error('PluginLoader must be set before loading any plugins');
      return;
    }

    await this.loader.loadPlugin(baseURL);
  }

  private setPluginsEnabled(
    pluginNames: string[],
    enabled: boolean,
    onEnabledChange: (plugin: LoadedPlugin) => void = _.noop,
  ) {
    let updateRequired = false;

    pluginNames.forEach((pluginName) => {
      if (!this.loadedPlugins.has(pluginName)) {
        consoleLogger.warn(
          `Attempt to ${
            enabled ? 'enable' : 'disable'
          } plugin ${pluginName} which is not loaded yet`,
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const plugin = this.loadedPlugins.get(pluginName)!;

      if (plugin.enabled !== enabled) {
        plugin.enabled = enabled;
        onEnabledChange(plugin);
        updateRequired = true;

        consoleLogger.info(`Plugin ${pluginName} will be ${enabled ? 'enabled' : 'disabled'}`);
      }
    });

    if (updateRequired) {
      this.invokeListeners(PluginEventType.PluginInfoChanged);
      this.updateExtensions();
    }
  }

  enablePlugins(pluginNames: string[]) {
    this.setPluginsEnabled(pluginNames, true, (plugin) => {
      // eslint-disable-next-line no-param-reassign
      plugin.disableReason = undefined;
    });
  }

  disablePlugins(pluginNames: string[], disableReason?: string) {
    this.setPluginsEnabled(pluginNames, false, (plugin) => {
      // eslint-disable-next-line no-param-reassign
      plugin.disableReason = disableReason;
    });
  }

  /**
   * Determine whether the given extension is currently in use, based on its feature flag
   * requirements (if any).
   */
  private isExtensionInUse(extension: Extension) {
    return (
      (extension.flags?.required?.every((f) => this.featureFlags[f] === true) ?? true) &&
      (extension.flags?.disallowed?.every((f) => this.featureFlags[f] === false) ?? true)
    );
  }

  updateExtensions() {
    const prevExtensions = this.extensions;

    this.extensions = Array.from(this.loadedPlugins.values()).reduce<LoadedExtension[]>(
      (acc, p) =>
        p.enabled ? [...acc, ...p.extensions.filter((e) => this.isExtensionInUse(e))] : acc,
      [],
    );

    if (!_.isEqual(prevExtensions, this.extensions)) {
      this.invokeListeners(PluginEventType.ExtensionsChanged);
    }
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

    consoleLogger.info(`Plugin ${pluginName} version ${pluginVersion} added to PluginStore`);

    return true;
  }

  registerFailedPlugin(pluginName: string, errorMessage: string, errorCause?: unknown) {
    if (this.loadedPlugins.has(pluginName)) {
      consoleLogger.warn(`Attempt to register an already loaded plugin ${pluginName} as failed`);
      return;
    }

    this.failedPlugins.set(pluginName, { errorMessage, errorCause });
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
