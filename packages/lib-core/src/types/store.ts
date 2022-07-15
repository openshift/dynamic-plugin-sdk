import type { LoadedExtension } from './extension';
import type { LoadedPlugin, FailedPlugin } from './plugin';

export enum PluginEventType {
  /**
   * Triggers when the list of extensions, which are currently in use, changes.
   *
   * Associated data getter: {@link PluginStoreInterface.getExtensions}
   */
  ExtensionsChanged = 'ExtensionsChanged',

  /**
   * Triggers on changes which have an impact on current plugin information:
   * - plugin was successfully loaded, processed and added to the `PluginStore`
   * - plugin failed to load, or there was an error while processing its extensions
   * - plugin was enabled or disabled (*)
   *
   * (*) this may trigger event {@link PluginEventType.ExtensionsChanged}
   *
   * Associated data getter: {@link PluginStoreInterface.getPluginInfo}
   */
  PluginInfoChanged = 'PluginInfoChanged',

  /**
   * Triggers when feature flags have changed.
   *
   * Associated data getter: {@link PluginStoreInterface.getFeatureFlags}
   */
  FeatureFlagsChanged = 'FeatureFlagsChanged',
}

export type LoadedPluginInfoEntry = {
  pluginName: string;
  status: 'loaded';
} & Pick<LoadedPlugin, 'metadata' | 'enabled' | 'disableReason'>;

export type FailedPluginInfoEntry = {
  pluginName: string;
  status: 'failed';
} & Pick<FailedPlugin, 'errorMessage' | 'errorCause'>;

export type PluginInfoEntry = LoadedPluginInfoEntry | FailedPluginInfoEntry;

export type FeatureFlags = { [key: string]: boolean };

export type PluginStoreInterface = {
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
   * Set new feature flags (non-boolean values will be discarded).
   */
  setFeatureFlags: (newFlags: FeatureFlags) => void;

  /**
   * Get current feature flags.
   */
  getFeatureFlags: () => FeatureFlags;

  /**
   * Start loading a plugin from the specified URL.
   *
   * Use `subscribe` method to respond to events emitted by the `PluginStore`.
   */
  loadPlugin: (baseURL: string) => void;

  /**
   * Enable the given plugin(s).
   *
   * Enabling a plugin puts all of its extensions into use.
   */
  enablePlugins: (pluginNames: string[]) => void;

  /**
   * Disable the given plugin(s) with an optional reason.
   *
   * Disabling a plugin puts all of its extensions out of use.
   */
  disablePlugins: (pluginNames: string[], disableReason?: string) => void;
};
