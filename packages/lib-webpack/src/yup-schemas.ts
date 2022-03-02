import * as yup from 'yup';
import { pluginRuntimeMetadataSchema } from '@openshift/dynamic-plugin-sdk';

/**
 * Schema for `PluginBuildMetadata` objects.
 */
export const pluginBuildMetadataSchema = pluginRuntimeMetadataSchema.shape({
  // TODO(vojtech): Here we'd like to validate `{ [moduleName: string]: string }`.
  // Unfortunately, Yup doesn't support map-like structures natively and workarounds
  // are ugly; we might need to switch to a different JS object validation library.
  exposedModules: yup.object(),
});
