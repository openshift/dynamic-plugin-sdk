// TODO(vojtech): suppress false positive https://github.com/jsx-eslint/eslint-plugin-react/pull/3326
/* eslint-disable react/forbid-prop-types */
import { array, object, string, ValidationError } from 'yup';
import { valid, validRange } from 'semver';

/**
 * Schema for a valid semver string.
 */
export const semverStringSchema = string()
  .required()
  .test('is-semver', 'Must be a valid semver string', (value: string) => {
    // valid may return a cleaned version (e.g., by stripping out leading 'v') but we need value to always be clean
    return valid(value, { loose: false }) === value;
  });

/**
 * Schema for a valid plugin name.
 *
 * @example
 * ```
 * foo
 * foo-bar
 * foo.bar
 * foo.bar-Test
 * Foo-Bar-abc.123
 * ```
 */
const pluginNameSchema = string()
  .required()
  .matches(/^[a-zA-Z]+(?:[-.]?[a-zA-Z0-9]+)*$/);

/**
 * Schema for a valid extension type.
 *
 * @example
 * ```
 * app.foo
 * app.foo-bar
 * app.foo/bar
 * My-app.Foo-Bar
 * My-app.Foo-Bar/abcTest
 * ```
 */
const extensionTypeSchema = string()
  .required()
  .matches(/^[a-zA-Z]+(?:-[a-zA-Z]+)*\.[a-zA-Z]+(?:-[a-zA-Z]+)*(?:\/[a-zA-Z]+(?:-[a-zA-Z]+)*)*$/);

/**
 * Schema for a valid feature flag name.
 *
 * @example
 * ```
 * FOO
 * FOO_BAR
 * FOO_BAR123
 * ```
 */
const featureFlagNameSchema = string()
  .required()
  .matches(/^[A-Z]+[A-Z0-9_]*$/);

/**
 * Schema for `Extension` objects.
 */
export const extensionSchema = object()
  .required()
  .shape({
    type: extensionTypeSchema,
    properties: object().required(),
    flags: object().shape({
      required: array().of(featureFlagNameSchema),
      disallowed: array().of(featureFlagNameSchema),
    }),
  });

/**
 * Schema for an array of `Extension` objects.
 */
export const extensionArraySchema = array().of(extensionSchema).required();

/**
 * Schema for Record<string, string> objects.
 */
export const recordStringStringSchema = object() // Rejects non-objects and null
  .test(
    'property?: Record<string, string>',
    'Must be either undefined OR an object with string keys and values',
    (obj: object) => {
      // Allow undefined because these fields are optional
      if (obj === undefined) {
        return true;
      }

      // Objects can have Symbol() as keys, so ensure there are none
      if (Object.getOwnPropertySymbols(obj).length > 0) {
        return new ValidationError('Must be an object with no symbols as keys');
      }

      // Object keys can only be symbols or strings, but since we've ruled out symbols,
      // we can assume that all keys are strings. We just need to check the values now
      return Object.values(obj).every((value) => typeof value === 'string');
    },
  );

/**
 * Schema for Record<string, string> objects where the values are semver ranges.
 */
export const recordStringSemverRangeSchema = recordStringStringSchema.test(
  'property?: Record<string, semver range>',
  'Must be either undefined OR an object with string keys and semver range values',
  (obj: object) => {
    // Allow undefined because these fields are optional
    if (obj === undefined) {
      return true;
    }

    // We've already verified in recordStringStringSchema that all keys/values are strings,
    // so we just need to check that they are valid semver ranges now
    return Object.values(obj).every((value) => validRange(value) !== null);
  },
);

/**
 * Schema for `PluginRuntimeMetadata` objects.
 */
export const pluginRuntimeMetadataSchema = object().required().shape({
  name: pluginNameSchema,
  version: semverStringSchema,
  dependencies: recordStringSemverRangeSchema,
  optionalDependencies: recordStringSemverRangeSchema,
  customProperties: object(),
});

/**
 * Schema for `RemotePluginManifest` objects.
 */
export const remotePluginManifestSchema = pluginRuntimeMetadataSchema.shape({
  baseURL: string().required(),
  extensions: extensionArraySchema,
  loadScripts: array().of(string().required()).required(),
  registrationMethod: string().oneOf(['callback', 'custom']).required(),
  buildHash: string(),
});
