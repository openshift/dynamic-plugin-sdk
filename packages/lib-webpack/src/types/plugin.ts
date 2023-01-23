import type { PluginRuntimeMetadata } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';

export type PluginBuildMetadata = PluginRuntimeMetadata & {
  exposedModules?: { [moduleName: string]: string };
};
