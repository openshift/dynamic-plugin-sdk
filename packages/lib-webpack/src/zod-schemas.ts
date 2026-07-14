import { z } from 'zod';
import {
  extensionSchema,
  pluginRuntimeMetadataSchema,
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';

/**
 * Schema for a `PluginBuildMetadata` object.
 */
const pluginBuildMetadataSchema = pluginRuntimeMetadataSchema.extend({
  exposedModules: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for a `PluginModuleFederationSettings` object.
 */
const pluginModuleFederationSettingsSchema = z
  .object({
    libraryType: z.string(),
    sharedScopeName: z.string(),
    pluginOverride: z.object({}).passthrough(),
  })
  .partial();

/**
 * Schema for a `PluginEntryCallbackSettings` object.
 */
const pluginEntryCallbackSettingsSchema = z
  .object({
    name: z.string(),
    pluginID: z.string(),
  })
  .partial();

/**
 * Schema for adapted `DynamicRemotePluginOptions` objects.
 */
export const dynamicRemotePluginAdaptedOptionsSchema = z.object({
  pluginMetadata: pluginBuildMetadataSchema,
  extensions: z.array(extensionSchema),
  sharedModules: z.object({}).passthrough().optional(),
  moduleFederationSettings: pluginModuleFederationSettingsSchema.optional(),
  entryCallbackSettings: pluginEntryCallbackSettingsSchema.optional(),
  entryScriptFilename: z.string().optional(),
  pluginManifestFilename: z.string().optional(),
  transformPluginManifest: z.function().optional(),
});
