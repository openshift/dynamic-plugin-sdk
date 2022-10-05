import * as yup from 'yup';

/**
 * Schema for a valid SemVer string.
 *
 * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 */
const semverStringSchema = yup
  .string()
  .required()
  .matches(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    'SemVer string',
  );

/**
 * Schema for a valid plugin name.
 *
 * Examples:
 *
 * ```
 * foo, foo-bar, foo.bar, foo.bar-test, foo-bar-abc.123-test
 * ```
 */
const pluginNameSchema = yup
  .string()
  .required()
  .matches(/^[a-z]+[a-z0-9-.]*[a-z]+$/, 'plugin name');

/**
 * Schema for a valid extension type.
 *
 * Examples:
 *
 * ```
 * app.foo, my-app.foo-bar, app.foo/bar, my-app.foo-bar/test/a-b
 * ```
 */
const extensionTypeSchema = yup
  .string()
  .required()
  .matches(/^[a-z]+[a-z-]*\.[a-z]+[a-z-]*(?:\/[a-z]+[a-z-]*)*$/, 'extension type');

/**
 * Schema for a valid feature flag name.
 *
 * Examples:
 *
 * ```
 * FOO, FOO_BAR
 * ```
 */
const featureFlagNameSchema = yup
  .string()
  .required()
  .matches(/^[A-Z]+[A-Z0-9_]*$/, 'feature flag name');

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
 * Schema for `PluginRuntimeMetadata` objects.
 */
export const pluginRuntimeMetadataSchema = yup.object().required().shape({
  name: pluginNameSchema,
  version: semverStringSchema,
  // TODO(vojtech): Yup lacks native support for map-like structures with arbitrary keys
  // TODO(vojtech): suppress false positive https://github.com/jsx-eslint/eslint-plugin-react/pull/3326
  // eslint-disable-next-line react/forbid-prop-types
  dependencies: yup.object(),
});

/**
 * Schema for `PluginManifest` objects.
 */
export const pluginManifestSchema = pluginRuntimeMetadataSchema.shape({
  extensions: extensionArraySchema,
});
