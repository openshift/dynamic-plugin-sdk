import type { Extension, LoadedExtension } from './extension';

export type PluginRuntimeMetadata = {
  name: string;
  version: string;
};

export type PluginRuntimeManifest = PluginRuntimeMetadata & {
  extensions: Extension[];
};

export type LoadedPlugin = {
  metadata: Readonly<PluginRuntimeMetadata>;
  extensions: Readonly<LoadedExtension[]>;
  enabled: boolean;
};
