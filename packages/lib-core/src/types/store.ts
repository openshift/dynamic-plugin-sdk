import type { AnyObject } from '@monorepo/common';
import type { LoadedExtension } from './extension';
import type { PluginManifest, PendingPlugin, LoadedPlugin, FailedPlugin } from './plugin';

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
   * - plugin failed to load, or there was an error while processing the plugin
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

export type PendingPluginInfoEntry = {
  status: 'pending';
} & Pick<PendingPlugin, 'manifest'>;

export type LoadedPluginInfoEntry = {
  status: 'loaded';
} & Pick<LoadedPlugin, 'manifest' | 'enabled' | 'disableReason'>;

export type FailedPluginInfoEntry = {
  status: 'failed';
} & Pick<FailedPlugin, 'manifest' | 'errorMessage' | 'errorCause'>;

export type PluginInfoEntry =
  | PendingPluginInfoEntry
  | LoadedPluginInfoEntry
  | FailedPluginInfoEntry;

export type FeatureFlags = { [flagName: string]: boolean };

export type PluginStoreInterface = {
  /**
   * Version of the `@openshift/dynamic-plugin-sdk` package.
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
   * instances.
   *
   * This method always returns a new array instance.
   */
  getExtensions: () => LoadedExtension[];

  /**
   * Get current information about plugins.
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
   * Merge the entries of `newFlags` with current feature flags (non-boolean values
   * will be discarded).
   */
  setFeatureFlags: (newFlags: FeatureFlags) => void;

  /**
   * Start loading a plugin from the given manifest.
   *
   * The plugin manifest can be provided directly as an object or referenced via URL.
   *
   * Depending on the plugin's current load status, this method works as follows:
   * - plugin is loading - do nothing
   * - plugin has been loaded - reload only if `forceReload` is `true`
   * - plugin has failed to load - always reload
   *
   * The resulting Promise resolves when the load operation is complete. If the given
   * plugin is still loading when this method is invoked, the same Promise instance that
   * represents the load operation is returned.
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
   * Get a specific module exposed by the given plugin.
   */
  getExposedModule: <TModule extends AnyObject>(
    pluginName: string,
    moduleName: string,
  ) => Promise<TModule>;

  /**
   * Notify the `PluginStore` that an error has occurred while processing the given plugin
   * or its extensions.
   *
   * If a plugin with the given name is currently loaded, this method will pass provided
   * error details to the custom plugin error handler registered with the `PluginStore`.
   *
   * The `reportedBy` argument indicates which code has reported the error. For example,
   * the `useResolvedExtensions` hook sets this value to `"useResolvedExtensions"`.
   */
  reportPluginError: (
    pluginName: string,
    reportedBy: string,
    errorMessage: string,
    errorCause?: unknown,
  ) => void;
};
