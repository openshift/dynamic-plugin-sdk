import type { Extension, LoadedExtension } from './extension';

export type PluginMetadata = {
  name: string;
  version: string;
};

export type PluginManifest = PluginMetadata & {
  extensions: Extension[];
};

export type LoadedPlugin = {
  metadata: Readonly<PluginMetadata>;
  extensions: Readonly<LoadedExtension[]>;
  enabled: boolean;
};
