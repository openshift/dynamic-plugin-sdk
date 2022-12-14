import type { AnyObject } from '@monorepo/common';
import type { LoadedExtension } from './extension';
import type { LoadedPlugin, FailedPlugin, PluginManifest } from './plugin';

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
   * An extension is in use when the associated plugin is currently enabled and its
   * feature flag requirements (if any) are met according to current feature flags.
   *
   * If you need to modify or augment existing extension objects, we recommend using
   * a custom React hook based on `useExtensions` or `useResolvedExtensions` hooks.
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
   * Merge the entries of `newFlags` with current feature flags (non-boolean values
   * will be discarded).
   */
  setFeatureFlags: (newFlags: FeatureFlags) => void;

  /**
   * Get current feature flags.
   *
   * Always returns a new object.
   */
  getFeatureFlags: () => FeatureFlags;

  /**
   * Load a plugin from the given URL.
   *
   * Under normal circumstances, a plugin manifest file is generated as part of the
   * plugin's build process and fetched by `PluginStore` at runtime over the network.
   *
   * By default, the plugin manifest will be fetched as `plugin-manifest.json` relative
   * to the plugin's base URL. Passing a custom object overrides the default manifest
   * fetch behavior.
   *
   * Be advised that any plugin modules which are already loaded by the host application
   * (e.g. directly via `getExposedModule` method or indirectly via `useResolvedExtensions`
   * hook) will _not_ be replaced upon reloading the associated plugin. This is due to how
   * webpack loads federated modules. If some of the plugins have changed and you need to
   * perform full reload of the plugin code, we recommend reloading the application page.
   *
   * Use `subscribe` method to respond to events emitted by the `PluginStore`.
   */
  loadPlugin: (baseURL: string, manifestNameOrObject?: string | PluginManifest) => Promise<void>;

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
};
