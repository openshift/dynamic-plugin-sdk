import { object, string } from 'yup';
import {
  extensionArraySchema,
  pluginRuntimeMetadataSchema,
  recordStringStringSchema
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';

/**
 * Schema for `PluginBuildMetadata` objects.
 */
export const pluginBuildMetadataSchema = pluginRuntimeMetadataSchema.shape({
  exposedModules: recordStringStringSchema,
});

/**
 * Schema for `PluginModuleFederationSettings` objects.
 */
const pluginModuleFederationSettingsSchema = object().required().shape({
  libraryType: string(),
  sharedScopeName: string(),
});

/**
 * Schema for `PluginEntryCallbackSettings` objects.
 */
const pluginEntryCallbackSettingsSchema = object().required().shape({
  name: string(),
  pluginID: string(),
});

/**
 * Schema for adapted `DynamicRemotePluginOptions` objects.
 */
export const dynamicRemotePluginAdaptedOptionsSchema = object().required().shape({
  pluginMetadata: pluginBuildMetadataSchema,
  extensions: extensionArraySchema,
  sharedModules: object().required(),
  moduleFederationSettings: pluginModuleFederationSettingsSchema,
  entryCallbackSettings: pluginEntryCallbackSettingsSchema,
  entryScriptFilename: string().required(),
  pluginManifestFilename: string().required(),
});
