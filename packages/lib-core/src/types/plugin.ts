import type { AnyObject } from '@monorepo/common';
import type { Extension, LoadedExtension } from './extension';
import type { PluginEntryModule } from './runtime';

export type PluginRegistrationMethod = 'callback' | 'custom';

export type PluginRuntimeMetadata = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  customProperties?: AnyObject;
};

export type PluginManifest = PluginRuntimeMetadata & {
  baseURL: string;
  extensions: Extension[];
  loadScripts: string[];
  registrationMethod: PluginRegistrationMethod;
  buildHash?: string;
};

export type PendingPlugin = {
  manifest: Readonly<PluginManifest>;
};

export type LoadedPlugin = {
  manifest: Readonly<PluginManifest>;
  loadedExtensions: Readonly<LoadedExtension[]>;
  entryModule: PluginEntryModule;
  enabled: boolean;
  disableReason?: string;
  customInfo?: AnyObject;
};

export type FailedPlugin = {
  manifest: Readonly<PluginManifest>;
  errorMessage: string;
  errorCause?: unknown;
};
