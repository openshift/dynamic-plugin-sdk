import { Extension, LoadedExtension } from './extension';

export type PluginManifest = {
  name: string;
  version: string;
  extensions: Extension[];
};

export type PluginMetadata = Omit<PluginManifest, 'extensions'>;

export type LoadedPlugin<TLoadedExtension extends LoadedExtension> = {
  metadata: Readonly<PluginMetadata>;
  extensions: Readonly<TLoadedExtension[]>;
  enabled: boolean;
};
