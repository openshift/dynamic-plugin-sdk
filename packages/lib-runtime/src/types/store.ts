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

/**
 * Interface for consuming runtime plugin information and extensions.
 */
export type PluginConsumer = {
  /**
   * Subscribe to events emitted by the `PluginStore`.
   *
   * See {@link PluginEventType} for information on specific event types.
   *
   * Returns a function for unsubscribing the provided listener.
   */
  subscribe: (listener: VoidFunction, eventTypes: PluginEventType[]) => VoidFunction;

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
   * Enable or disable the given plugin.
   *
   * Enabling the plugin puts all of its extensions into use. Disabling it does the opposite.
   */
  setPluginEnabled: (pluginName: string, enabled: boolean) => void;
};
