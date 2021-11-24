import { Extension, LoadedExtension } from './extension';

export type PluginMetadata = {
  name: string;
  version: string;
};

export type PluginManifest = PluginMetadata & {
  extensions: Extension[];
};

export type LoadedPlugin<TLoadedExtension extends LoadedExtension = LoadedExtension> = {
  metadata: Readonly<PluginMetadata>;
  extensions: Readonly<TLoadedExtension[]>;
  enabled: boolean;
};
