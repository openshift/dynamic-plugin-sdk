import type { AnyObject } from '@monorepo/common';
import type { LoadedExtension } from './extension';
import type { PluginManifest, PendingPlugin, LoadedPlugin, FailedPlugin } from './plugin';

export enum PluginEventType {
  /**
   * Triggers when the list of extensions, which are currently in use, changes.
   *
   * See the `getExtensions` function for details on evaluating extensions which are
   * currently in use.
   *
   * Associated data getter: {@link PluginStoreInterface.getExtensions}
   */
  ExtensionsChanged = 'ExtensionsChanged',

  /**
   * Triggers on changes which have an impact on current plugin information:
   * - plugin was successfully loaded, processed and added to the `PluginStore`
   * - plugin failed to load, or there was an error while processing the plugin
   * - plugin was enabled or disabled
   *
   * This may also trigger event {@link PluginEventType.ExtensionsChanged} in response
   * to enabling or disabling a plugin.
   *
   * Associated data getter: {@link PluginStoreInterface.getPluginInfo}
   */
  PluginInfoChanged = 'PluginInfoChanged',

  /**
   * Triggers when feature flags have changed.
   *
   * This may also trigger event {@link PluginEventType.ExtensionsChanged} in response
   * to re-evaluating extensions which are currently in use based on new feature flags.
   *
   * Associated data getter: {@link PluginStoreInterface.getFeatureFlags}
   */
  FeatureFlagsChanged = 'FeatureFlagsChanged',
}

/**
 * Information on a plugin in `pending` state.
 *
 * Plugins in this state are currently being loaded.
 */
export type PendingPluginInfoEntry = {
  status: 'pending';
} & Pick<PendingPlugin, 'manifest'>;

/**
 * Information on a plugin in `loaded` state.
 *
 * Plugins in this state were successfully loaded and processed.
 */
export type LoadedPluginInfoEntry = {
  status: 'loaded';
} & Pick<LoadedPlugin, 'manifest' | 'enabled' | 'disableReason'>;

/**
 * Information on a plugin in `failed` state.
 *
 * Plugins in this state failed to load or get processed properly.
 */
export type FailedPluginInfoEntry = {
  status: 'failed';
} & Pick<FailedPlugin, 'manifest' | 'errorMessage' | 'errorCause'>;

export type PluginInfoEntry =
  | PendingPluginInfoEntry
  | LoadedPluginInfoEntry
  | FailedPluginInfoEntry;

/**
 * Feature flags used to control enablement of all extensions.
 */
export type FeatureFlags = { [flagName: string]: boolean };

/**
 * Common interface implemented by the `PluginStore`.
 */
export type PluginStoreInterface = {
  /**
   * Current build version of the `@openshift/dynamic-plugin-sdk` package.
   */
  readonly sdkVersion: string;

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
   * An extension is in use when the associated plugin is currently enabled and its
   * feature flag requirements (if any) are met according to current feature flags.
   *
   * If you need to enhance or modify existing extension objects after the associated
   * plugin has been loaded and processed, we recommend using a custom React hook which
   * calls `useExtensions` or `useResolvedExtensions` and returns new extension object
   * instances. In other words, we strongly discourage modifying the original extension
   * objects managed by the `PluginStore`.
   *
   * This method always returns a new array instance.
   */
  getExtensions: () => LoadedExtension[];

  /**
   * Get current information on all plugins.
   *
   * This method always returns a new array instance.
   */
  getPluginInfo: () => PluginInfoEntry[];

  /**
   * Get current feature flags.
   *
   * This method always returns a new object.
   */
  getFeatureFlags: () => FeatureFlags;

  /**
   * Set current feature flags by merging them with `newFlags`.
   *
   * Entries with non-boolean values will be discarded.
   */
  setFeatureFlags: (newFlags: FeatureFlags) => void;

  /**
   * Start loading a plugin from the given manifest.
   *
   * The plugin manifest can be provided as an object or referenced via URL.
   *
   * Depending on the plugin's current load status, this method works as follows:
   * - plugin is still loading - do nothing
   * - plugin has been loaded - reload only if `forceReload` is `true`
   * - plugin has failed to load - always reload
   *
   * The resulting Promise resolves when the load operation is complete. If the given
   * plugin is still loading when this method is invoked, the same Promise instance that
   * represents the load operation is returned.
   *
   * The resulting Promise rejects only when the plugin manifest cannot be loaded or
   * processed by the `PluginLoader` implementation.
   *
   * Use the `subscribe` method to respond to events emitted by the `PluginStore`.
   *
   * Be advised that any plugin modules which are already loaded by the host application
   * will _not_ be replaced upon reloading the associated plugin. This is due to webpack
   * module caching which also applies to federated modules. If a host application detects
   * changes in a plugin's deployment, users should be prompted to reload the application
   * to ensure all plugin modules in use are up to date.
   */
  loadPlugin: (manifest: PluginManifest | string, forceReload?: boolean) => Promise<void>;

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

  /**
   * Get a module exposed by the given plugin.
   *
   * The plugin is expected to be loaded by the `PluginStore`.
   */
  getExposedModule: <TModule extends AnyObject>(
    pluginName: string,
    moduleName: string,
  ) => Promise<TModule>;
};
