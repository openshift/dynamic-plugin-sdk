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
export { PluginLoaderOptions } from './runtime/PluginLoader';
export { PluginStore, PluginStoreOptions } from './runtime/PluginStore';
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
} from './runtime/useResolvedExtensions';
export { useFeatureFlag, UseFeatureFlagResult } from './runtime/useFeatureFlag';
export { usePluginInfo } from './runtime/usePluginInfo';

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
export {
  PluginRegistrationMethod,
  PluginRuntimeMetadata,
  PluginManifest,
  TransformPluginManifest,
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
