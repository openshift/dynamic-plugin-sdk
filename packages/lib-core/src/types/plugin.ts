import type { AnyObject } from '@monorepo/common';
import type { Extension, LoadedExtension } from './extension';
import type { PluginEntryModule } from './runtime';

export type PluginRegistrationMethod = 'callback' | 'custom';

export type PluginRuntimeMetadata = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  customProperties?: AnyObject;
};

export type PluginManifest = PluginRuntimeMetadata & {
  baseURL: string;
  extensions: Extension[];
  loadScripts: string[];
  registrationMethod: PluginRegistrationMethod;
  buildHash?: string;
};

export type LoadedPluginManifest = Omit<Required<PluginManifest>, 'extensions'>;

export type LoadedPlugin = {
  manifest: Readonly<LoadedPluginManifest>;
  extensions: Readonly<LoadedExtension[]>;
  entryModule: PluginEntryModule;
  enabled: boolean;
  disableReason?: string;
};

export type FailedPlugin = {
  errorMessage: string;
  errorCause?: unknown;
};
