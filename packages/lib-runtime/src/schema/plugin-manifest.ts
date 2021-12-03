import * as joi from 'joi';

/**
 * Schema for a valid SemVer string.
 *
 * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 */
const semverString = joi
  .string()
  .pattern(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    'SemVer',
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
const pluginName = joi.string().pattern(/^[a-z]+[a-z0-9-.]*[a-z]+$/, 'plugin name');

/**
 * Schema for `Extension.type` property.
 *
 * Examples of valid extension types:
 *
 * ```
 * app.foo, my-app.foo-bar, app.foo/bar, my-app.foo-bar/test/a-b
 * ```
 */
const extensionType = joi
  .string()
  .pattern(/^[a-z]+[a-z-]*\.[a-z]+[a-z-]*(?:\/[a-z]+[a-z-]*)*$/, 'extension type');

/**
 * Schema for `Extension` type.
 */
const extensionSchema = joi.object({
  type: extensionType,
  properties: joi.object(),
});

/**
 * Schema for `PluginManifest` type.
 */
export const pluginManifestSchema = joi.object({
  name: pluginName,
  version: semverString,
  extensions: joi.array().items(extensionSchema),
});
