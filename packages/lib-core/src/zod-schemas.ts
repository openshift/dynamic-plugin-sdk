import { valid, validRange } from 'semver';
import { z } from 'zod';

/**
 * Schema for a valid semver string.
 */
export const semverStringSchema = z.string().refine(
  // Compare the cleaned version returned by valid() with input value to determine semver compliance
  (value) => valid(value, { loose: false }) === value,
  { message: 'Must be a valid semver string' },
);

/**
 * Schema for a valid semver range.
 */
export const semverRangeSchema = z
  .string()
  .refine((value) => validRange(value) !== null, { message: 'Must be a valid semver range' });

/**
 * Schema for a valid plugin name.
 */
export const pluginNameSchema = z.string().regex(/^[a-zA-Z]+(?:[-.]?[a-zA-Z0-9]+)*$/);

/**
 * Schema for a valid `Extension` type.
 */
export const extensionTypeSchema = z
  .string()
  .regex(/^[a-zA-Z]+(?:-[a-zA-Z]+)*\.[a-zA-Z]+(?:-[a-zA-Z]+)*(?:\/[a-zA-Z]+(?:-[a-zA-Z]+)*)*$/);

/**
 * Schema for a valid feature flag name.
 */
export const featureFlagNameSchema = z.string().regex(/^[A-Z]+(?:[A-Z0-9]|_[A-Z0-9])*$/);

/**
 * Schema for an `Extension` object.
 */
export const extensionSchema = z.object({
  type: extensionTypeSchema,
  properties: z.object({}).passthrough(),
  flags: z
    .object({
      required: z.array(featureFlagNameSchema),
      disallowed: z.array(featureFlagNameSchema),
    })
    .partial()
    .optional(),
});

/**
 * Schema for a `Record<string, string>` object with all values being valid semver ranges.
 */
const recordStringSemverRangeSchema = z.record(z.string(), semverRangeSchema);

/**
 * Schema for a `PluginRuntimeMetadata` object.
 */
export const pluginRuntimeMetadataSchema = z.object({
  name: pluginNameSchema,
  version: semverStringSchema,
  dependencies: recordStringSemverRangeSchema.optional(),
  optionalDependencies: recordStringSemverRangeSchema.optional(),
  customProperties: z.object({}).passthrough().optional(),
});

/**
 * Schema for a `RemotePluginManifest` object.
 */
export const remotePluginManifestSchema = pluginRuntimeMetadataSchema.extend({
  baseURL: z.string().url(),
  extensions: z.array(extensionSchema),
  loadScripts: z.array(z.string()).nonempty(),
  registrationMethod: z.enum(['callback', 'custom']),
  buildHash: z.string().optional(),
});
