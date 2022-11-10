import * as yup from 'yup';
import { pluginRuntimeMetadataSchema } from '@openshift/dynamic-plugin-sdk/src/yup-schemas';

/**
 * Schema for `PluginBuildMetadata` objects.
 */
export const pluginBuildMetadataSchema = pluginRuntimeMetadataSchema.shape({
  // TODO(vojtech): Yup lacks native support for map-like structures with arbitrary keys
  exposedModules: yup.object(),
  entryScript: yup.string()
});
