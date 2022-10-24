import type { PluginRuntimeMetadata } from '@openshift/dynamic-plugin-sdk';

export type PluginBuildMetadata = PluginRuntimeMetadata & {
  exposedModules?: { [moduleName: string]: string };
};
