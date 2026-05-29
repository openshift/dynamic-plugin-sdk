/**
 * Core runtime package of the dynamic plugin SDK.
 *
 * @remarks
 * This package allows loading, managing and interpreting dynamic plugins at runtime.
 *
 * @packageDocumentation
 */

// Common types and utilities
export {
  AnyObject,
  applyDefaults,
  applyOverrides,
  cloneDeepOnlyCloneableValues,
  consoleLogger,
  CustomError,
  EitherNotBoth,
  EitherOrNone,
  LogFunction,
  Logger,
  Never,
  ReplaceProperties,
  visitDeep,
} from '@monorepo/common';
// Core utilities
export {
  applyCodeRefSymbol,
  isCodeRef,
  isEncodedCodeRef,
  parseEncodedCodeRef,
} from './runtime/coderefs';
// Core components
export { PluginLoader, PluginLoaderOptions } from './runtime/PluginLoader';
export { PluginStore, PluginStoreLoaderSettings, PluginStoreOptions } from './runtime/PluginStore';
export {
  PluginStoreProvider,
  PluginStoreProviderProps,
  usePluginStore,
} from './runtime/PluginStoreProvider';
// React hooks
export { useExtensions } from './runtime/useExtensions';
export { useFeatureFlag, UseFeatureFlagResult } from './runtime/useFeatureFlag';
export { usePluginInfo } from './runtime/usePluginInfo';
export {
  useResolvedExtensions,
  UseResolvedExtensionsOptions,
  UseResolvedExtensionsResult,
} from './runtime/useResolvedExtensions';
// Testing utilities
export { TestPluginStore } from './testing/TestPluginStore';
// Core types
export {
  CodeRef,
  CodeRefsToEncodedCodeRefs,
  CodeRefsToValues,
  EncodedCodeRef,
  EncodedExtension,
  Extension,
  ExtensionFlags,
  ExtensionPredicate,
  ExtractExtensionProperties,
  LoadedAndResolvedExtension,
  LoadedExtension,
  MapCodeRefsToEncodedCodeRefs,
  MapCodeRefsToValues,
  ResolvedExtension,
} from './types/extension';
export { ResourceFetch } from './types/fetch';
export { PluginLoaderInterface, PluginLoadResult } from './types/loader';
export {
  FailedPlugin,
  LoadedPlugin,
  LocalPluginManifest,
  PendingPlugin,
  PluginCustomProperties,
  PluginManifest,
  PluginRuntimeMetadata,
  RemotePluginManifest,
} from './types/plugin';
export { PluginEntryModule } from './types/runtime';
export {
  FailedPluginInfoEntry,
  FeatureFlags,
  FeatureFlagValue,
  LoadedPluginInfoEntry,
  PendingPluginInfoEntry,
  PluginEventType,
  PluginInfoEntry,
  PluginStoreInterface,
} from './types/store';
