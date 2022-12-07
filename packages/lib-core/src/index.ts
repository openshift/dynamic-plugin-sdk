/**
 * Core runtime package of the dynamic plugin SDK.
 *
 * @remarks
 * This package allows loading, managing and interpreting dynamic plugins at runtime.
 *
 * @packageDocumentation
 */

// Core components
export {
  PluginLoader,
  PluginLoaderOptions,
  PluginLoadListener,
  PluginLoadResult,
} from './store/PluginLoader';
export { PluginStore, PluginStoreOptions } from './store/PluginStore';
export {
  PluginStoreProvider,
  PluginStoreProviderProps,
  usePluginStore,
} from './store/PluginStoreContext';

// React hooks
export { useExtensions } from './store/useExtensions';
export { useResolvedExtensions, UseResolvedExtensionsResult } from './store/useResolvedExtensions';
export { useFeatureFlag, UseFeatureFlagResult } from './store/useFeatureFlag';
export { usePluginInfo } from './store/usePluginInfo';

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
  MapCodeRefsToEncodedCodeRefs,
  MapCodeRefsToValues,
  ExtractExtensionProperties,
} from './types/extension';
export { ResourceFetch } from './types/fetch';
export { PluginManifest, PluginRuntimeMetadata, LoadedPlugin, FailedPlugin } from './types/plugin';
export { PluginEntryModule } from './types/runtime';
export {
  PluginEventType,
  PluginInfoEntry,
  LoadedPluginInfoEntry,
  FailedPluginInfoEntry,
  FeatureFlags,
  PluginStoreInterface,
} from './types/store';

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
