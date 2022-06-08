import type { LoadedExtension } from './extension';
import type { LoadedPlugin } from './plugin';

export enum PluginEventType {
  /**
   * Triggers when the list of extensions, which are currently in use, changes.
   *
   * Associated data getter: {@link PluginConsumer.getExtensions}
   */
  ExtensionsChanged = 'ExtensionsChanged',

  /**
   * Triggers on changes which have an impact on current plugin information:
   * - plugin was successfully loaded, processed and added to the `PluginStore`
   * - plugin failed to load, or there was an error while processing its extensions
   * - plugin was enabled or disabled (*)
   *
   * (*) this triggers event {@link PluginEventType.ExtensionsChanged}
   *
   * Associated data getter: {@link PluginConsumer.getPluginInfo}
   */
  PluginInfoChanged = 'PluginInfoChanged',

  /**
   * Triggers when feature flags have changed.
   *
   * Associated data getter: {@link PluginManager.getFeatureFlags}
   */
  FeatureFlagsChanged = 'FeatureFlagsChanged',
}

export type PluginInfoEntry =
  | {
      pluginName: string;
      status: 'loaded';
      metadata: LoadedPlugin['metadata'];
      enabled: boolean;
    }
  | {
      pluginName: string;
      status: 'pending' | 'failed';
    };

export type FeatureFlags = { [key: string]: boolean };

// TODO: PluginConsumer and PluginManager should be unified into a single interface
/**
 * Interface for consuming plugin information and extensions.
 */
export type PluginConsumer = {
  /**
   * Subscribe to events emitted by the `PluginStore`.
   *
   * See {@link PluginEventType} for information on specific event types.
   *
   * Returns a function for unsubscribing the provided listener.
   */
  subscribe: (eventTypes: PluginEventType[], listener: VoidFunction) => VoidFunction;

  /**
   * Get extensions which are currently in use.
   *
   * An extension is in use when the associated plugin is currently enabled.
   *
   * Always returns a new array instance.
   */
  getExtensions: () => LoadedExtension[];

  /**
   * Get current information about plugins.
   *
   * Always returns a new array instance.
   */
  getPluginInfo: () => PluginInfoEntry[];

  /**
   * Set feature flags in the PluginStore (non-boolean values will be discarded)
   */
  setFeatureFlags: (newFlags: FeatureFlags) => void;

  /**
   * Get feature flags from the PluginStore
   */
  getFeatureFlags: () => FeatureFlags;
};

/**
 * Interface for managing plugins.
 */
export type PluginManager = {
  /**
   * Start loading a plugin from the specified URL.
   *
   * Use {@link PluginConsumer.subscribe} to respond to relevant events.
   */
  loadPlugin: (baseURL: string) => void;

  /**
   * Enable or disable the given plugins.
   *
   * Enabling a plugin puts all of its extensions into use. Disabling it does the opposite.
   */
  setPluginsEnabled: (config: { pluginName: string; enabled: boolean }[]) => void;
};
