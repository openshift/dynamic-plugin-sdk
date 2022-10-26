import type { Extension, LoadedExtension } from './extension';
import type { PluginEntryModule } from './runtime';

export type PluginRuntimeMetadata = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
};

export type PluginManifest = PluginRuntimeMetadata & {
  extensions: Extension[];
};

export type LoadedPlugin = {
  metadata: Readonly<PluginRuntimeMetadata>;
  extensions: Readonly<LoadedExtension[]>;
  entryModule: PluginEntryModule;
  enabled: boolean;
  disableReason?: string;
};

export type FailedPlugin = {
  errorMessage: string;
  errorCause?: unknown;
};
