// Main APIs, to be consumed by plugins and host applications
export { PluginLoader, PluginLoaderOptions } from './store/PluginLoader';
export { PluginStore, PluginStoreOptions } from './store/PluginStore';
export { PluginStoreProvider, usePluginStore } from './store/PluginStoreContext';
export { useFeatureFlag } from './store/useFeatureFlag';
export { useExtensions } from './store/useExtensions';
export { usePluginInfo } from './store/usePluginInfo';
export { useResolvedExtensions } from './store/useResolvedExtensions';
export {
  Extension,
  ExtensionPredicate,
  LoadedExtension,
  EncodedExtension,
  ResolvedExtension,
} from './types/extension';
export {
  PluginEventType,
  PluginInfoEntry,
  LoadedPluginInfoEntry,
  FailedPluginInfoEntry,
  FeatureFlags,
  PluginStoreInterface,
} from './types/store';
export { PluginManifest, PluginRuntimeMetadata, LoadedPlugin } from './types/plugin';

// Core extension types, to be exported via lib-extensions package
export * from './extensions';
