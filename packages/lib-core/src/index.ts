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
  ReplaceProperties,
  Never,
  EitherNotBoth,
  EitherOrNone,
  CustomError,
  applyDefaults,
  applyOverrides,
  LogFunction,
  Logger,
  consoleLogger,
} from '@monorepo/common';

// Core components
export { PluginLoader, PluginLoaderOptions } from './runtime/PluginLoader';
export { PluginStore, PluginStoreOptions, PluginStoreLoaderSettings } from './runtime/PluginStore';
export {
  PluginStoreProvider,
  PluginStoreProviderProps,
  usePluginStore,
} from './runtime/PluginStoreContext';

// React hooks
export { useExtensions } from './runtime/useExtensions';
export {
  useResolvedExtensions,
  UseResolvedExtensionsResult,
  UseResolvedExtensionsOptions,
} from './runtime/useResolvedExtensions';
export { usePluginInfo } from './runtime/usePluginInfo';
export { useFeatureFlag, UseFeatureFlagResult } from './runtime/useFeatureFlag';

// Core utilities
export { applyCodeRefSymbol } from './runtime/coderefs';

// Testing utilities
export { TestPluginStore } from './testing/TestPluginStore';

// Core types
export {
  CodeRef,
  EncodedCodeRef,
  Extension,
  ExtensionFlags,
  ExtensionPredicate,
  EncodedExtension,
  LoadedExtension,
  ResolvedExtension,
  CodeRefsToValues,
  CodeRefsToEncodedCodeRefs,
  MapCodeRefsToEncodedCodeRefs,
  MapCodeRefsToValues,
  ExtractExtensionProperties,
} from './types/extension';
export { ResourceFetch } from './types/fetch';
export { PluginLoadResult, PluginLoaderInterface } from './types/loader';
export {
  PluginCustomProperties,
  PluginRuntimeMetadata,
  RemotePluginManifest,
  LocalPluginManifest,
  PluginManifest,
  PendingPlugin,
  LoadedPlugin,
  FailedPlugin,
} from './types/plugin';
export { PluginEntryModule } from './types/runtime';
export {
  PluginEventType,
  PluginInfoEntry,
  PendingPluginInfoEntry,
  LoadedPluginInfoEntry,
  FailedPluginInfoEntry,
  FeatureFlags,
  PluginStoreInterface,
} from './types/store';
