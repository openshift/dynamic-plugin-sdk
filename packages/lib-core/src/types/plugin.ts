import type { Extension, LoadedExtension } from './extension';
import type { PluginEntryModule } from './runtime';

/**
 * This interface can be extended by the host application to type the
 * {@link PluginRuntimeMetadata.customProperties} object to reflect supported
 * application or environment specific properties.
 *
 * @example
 * ```
 * // in your d.ts declaration file
 * import type { SupportedCustomProperties } from './types';
 *
 * declare module '@openshift/dynamic-plugin-sdk' {
 *   interface PluginCustomProperties extends SupportedCustomProperties {}
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginCustomProperties {}

/**
 * Runtime plugin metadata.
 *
 * There can be only one plugin with the given `name` loaded at any time.
 *
 * Any dependencies on other plugins will be resolved as part of the plugin's load process.
 *
 * The `customProperties` object may contain additional information to be interpreted by the host
 * application. We recommend scoping related application or environment specific properties under
 * the same key, for example:
 *
 * ```js
 * customProperties: {
 *   sampleApp: {
 *     // Custom properties supported by the sample application
 *   }
 * }
 * ```
 */
export type PluginRuntimeMetadata = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  customProperties?: PluginCustomProperties;
};

/**
 * Plugin manifest generated as part of the plugin's webpack build.
 *
 * The `extensions` list contains all extensions contributed by the plugin. Code references
 * within each extension's properties are serialized as JSON objects `{ $codeRef: string }`.
 *
 * The `baseURL` should be used when loading all plugin assets, including the ones listed
 * in `loadScripts`.
 *
 * This is the standard representation of a plugin manifest; we load the specified scripts
 * from remote sources in order to initialize the plugin and provide access to its exposed
 * modules.
 */
export type RemotePluginManifest = PluginRuntimeMetadata & {
  baseURL: string;
  extensions: Extension[];
  loadScripts: string[];
  registrationMethod: 'callback' | 'custom';
  buildHash?: string;
};

/**
 * Plugin manifest created directly by your application.
 *
 * Code references within each extension's properties should be represented as `CodeRef`
 * functions, i.e. there is no JSON deserialization of code references for plugins loaded
 * from local manifests.
 *
 * This is the local representation of a plugin manifest; you can use it to implement the
 * concept of plugins which are statically linked to the host application at its build time.
 *
 * Note that plugins defined this way will have no entry module and no exposed modules.
 */
export type LocalPluginManifest = PluginRuntimeMetadata & {
  extensions: Extension[];
  registrationMethod: 'local';
};

export type PluginManifest = RemotePluginManifest | LocalPluginManifest;

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
  entryModule?: PluginEntryModule;
  enabled: boolean;
  disableReason?: string;
};

/**
 * Internal entry on a plugin in `failed` state.
 */
export type FailedPlugin = {
  manifest: Readonly<PluginManifest>;
  errorMessage: string;
  errorCause?: unknown;
};
