// TODO(vojtech): suppress false positive https://github.com/jsx-eslint/eslint-plugin-react/pull/3326
/* eslint-disable react/forbid-prop-types */
import * as yup from 'yup';

/**
 * Schema for a valid semver string.
 *
 * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 */
const semverStringSchema = yup
  .string()
  .required()
  .matches(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  );

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
const pluginNameSchema = yup
  .string()
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
const extensionTypeSchema = yup
  .string()
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
const featureFlagNameSchema = yup
  .string()
  .required()
  .matches(/^[A-Z]+[A-Z0-9_]*$/);

/**
 * Schema for `Extension` objects.
 */
export const extensionSchema = yup
  .object()
  .required()
  .shape({
    type: extensionTypeSchema,
    properties: yup.object().required(),
    flags: yup.object().shape({
      required: yup.array().of(featureFlagNameSchema),
      disallowed: yup.array().of(featureFlagNameSchema),
    }),
  });

/**
 * Schema for an array of `Extension` objects.
 */
export const extensionArraySchema = yup.array().of(extensionSchema).required();

/**
 * Schema for Record<string, string> objects.
 */
export const recordStringStringSchema = yup
  .object() // Rejects non-objects and null
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
        return new yup.ValidationError('Must be an object with no symbols as keys');
      }

      // Object keys can only be symbols or strings, but since we've ruled out symbols,
      // we can assume that all keys are strings. We just need to check the values now
      return Object.values(obj).every((value) => typeof value === 'string');
    },
  );

/**
 * Schema for `PluginRuntimeMetadata` objects.
 */
export const pluginRuntimeMetadataSchema = yup.object().required().shape({
  name: pluginNameSchema,
  version: semverStringSchema,
  dependencies: recordStringStringSchema,
  optionalDependencies: recordStringStringSchema,
  customProperties: yup.object(),
});

/**
 * Schema for `RemotePluginManifest` objects.
 */
export const remotePluginManifestSchema = pluginRuntimeMetadataSchema.shape({
  baseURL: yup.string().required(),
  extensions: extensionArraySchema,
  loadScripts: yup.array().of(yup.string().required()).required(),
  registrationMethod: yup.string().oneOf(['callback', 'custom']).required(),
  buildHash: yup.string(),
});
