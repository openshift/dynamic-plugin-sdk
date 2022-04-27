// Main APIs, to be consumed by plugins and host applications
export { PluginLoader, PluginLoaderOptions } from './store/PluginLoader';
export { PluginStore, PluginStoreOptions } from './store/PluginStore';
export { PluginStoreProvider, usePluginStore } from './store/PluginStoreContext';
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
export { PluginEventType, PluginInfoEntry, PluginConsumer, PluginManager } from './types/store';

// Core extension types, to be exported via lib-extensions package
export * from './extensions';
