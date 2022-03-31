import type { PluginRuntimeMetadata } from '@openshift/dynamic-plugin-sdk/src/types/plugin';

export type PluginBuildMetadata = PluginRuntimeMetadata & {
  exposedModules?: { [moduleName: string]: string };
};
