import type { AnyObject } from '@monorepo/common';
import type { Extension, LoadedExtension } from './extension';
import type { PluginEntryModule } from './runtime';

/**
 * Registration method used to finalize the plugin's load process.
 *
 * In order to load plugins using the `callback` registration method, the host application
 * must register a global entry callback function to be called by the plugin's entry script.
 *
 * In order to load plugins using the `custom` registration method, the host application must
 * provide a way to retrieve the entry module that was loaded by the plugin's entry script.
 *
 * @see {@link PluginEntryModule}
 */
export type PluginRegistrationMethod = 'callback' | 'custom';

/**
 * Runtime plugin metadata.
 *
 * There can be only one plugin with the given `name` loaded at any time.
 *
 * Any dependencies on other plugins will be resolved as part of the plugin's load process.
 *
 * The `customProperties` object may contain additional information for the host application.
 */
export type PluginRuntimeMetadata = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  customProperties?: AnyObject;
};

/**
 * Plugin manifest object, generated during the webpack build of the plugin.
 *
 * The `extensions` list contains all extensions contributed by the plugin. Code references
 * within each extension's properties are serialized as JSON objects `{ $codeRef: string }`.
 *
 * The `baseURL` should be used when loading all plugin assets, including the ones listed in
 * `loadScripts`.
 */
export type PluginManifest = PluginRuntimeMetadata & {
  baseURL: string;
  extensions: Extension[];
  loadScripts: string[];
  registrationMethod: PluginRegistrationMethod;
  buildHash?: string;
};

/**
 * Internal entry on a plugin in `pending` state.
 */
export type PendingPlugin = {
  manifest: Readonly<PluginManifest>;
};

/**
 * Internal entry on a plugin in `loaded` state.
 */
export type LoadedPlugin = {
  manifest: Readonly<PluginManifest>;
  loadedExtensions: Readonly<LoadedExtension[]>;
  entryModule: PluginEntryModule;
  enabled: boolean;
  disableReason?: string;
  customData: AnyObject;
};

/**
 * Internal entry on a plugin in `failed` state.
 */
export type FailedPlugin = {
  manifest: Readonly<PluginManifest>;
  errorMessage: string;
  errorCause?: unknown;
};
