import * as yup from 'yup';

/**
 * Schema for a valid SemVer string.
 *
 * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 */
const semverString = yup
  .string()
  .required()
  .matches(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    'SemVer string',
  );

/**
 * Schema for `PluginMetadata.name` property.
 *
 * Examples of valid plugin names:
 *
 * ```
 * foo, foo-bar, foo.bar, foo.bar-test, foo-bar-abc.123-test
 * ```
 */
const pluginName = yup
  .string()
  .required()
  .matches(/^[a-z]+[a-z0-9-.]*[a-z]+$/, 'plugin name');

/**
 * Schema for `Extension.type` property.
 *
 * Examples of valid extension types:
 *
 * ```
 * app.foo, my-app.foo-bar, app.foo/bar, my-app.foo-bar/test/a-b
 * ```
 */
const extensionType = yup
  .string()
  .required()
  .matches(/^[a-z]+[a-z-]*\.[a-z]+[a-z-]*(?:\/[a-z]+[a-z-]*)*$/, 'extension type');

/**
 * Schema for `Extension` objects.
 */
const extension = yup.object().required().shape({
  type: extensionType,
  properties: yup.object().required(),
});

/**
 * Schema for `PluginManifest` objects.
 */
export const pluginManifest = yup
  .object()
  .required()
  .shape({
    name: pluginName,
    version: semverString,
    extensions: yup.array().of(extension).required(),
  });

export { pluginManifest as pluginManifestSchema };
