import type { AnyObject, ReplaceProperties } from '@monorepo/common';

/**
 * An extension's feature flag settings.
 *
 * In order for an extension to be in use:
 * - for every flag name in `required` list - flag value must be `true`
 * - for every flag name in `disallowed` list - flag value must be `false`
 */
export type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

/**
 * An extension of your application.
 *
 * Each extension instance extends the application's functionality in a specific way.
 * A plugin consists of one or more extension instances that, combined together, adapt
 * or extend the base application's functionality.
 *
 * The `type` property determines the kind of the extension, while the `properties`
 * object contains data and/or code necessary to interpret the given extension type.
 *
 * We recommend using a structured extension type format, for example:
 * ```js
 * app.page/route // adds new route that renders the given page component
 * app.page/resource/list // adds new list page for the given resource
 * app.page/resource/details // adds new details page for the given resource
 * ```
 *
 * The `properties` object may contain code references represented as {@link CodeRef}
 * values. Each code reference should be resolved (e.g. referenced value loaded over
 * the network via `import()` function) only when needed. Therefore, any code reference
 * resolution errors should be handled as part of interpreting the given extension type.
 *
 * Extensions may also use feature flags to express condition(s) of their enablement.
 *
 * @see {@link ExtensionFlags}
 */
export type Extension<TType extends string = string, TProperties extends AnyObject = AnyObject> = {
  type: TType;
  properties: TProperties;
  flags?: ExtensionFlags;
  [customProperty: string]: unknown;
};

/**
 * Runtime extension interface, exposing additional metadata.
 *
 * The value of `uid` property is guaranteed to be unique for each extension instance.
 * This value can be used when rendering associated React JSX elements that require the
 * `key` prop.
 */
export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
};

/**
 * Type guard that acts as a predicate to filter extensions of a specific type.
 */
export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;

/**
 * Code reference, encoded as an object literal for JSON serialization purposes.
 *
 * The value of `$codeRef` property should be one of the following:
 * - `moduleName.exportName` - refers to the given module's named export
 * - `moduleName` - refers to the given module's `default` export
 */
export type EncodedCodeRef = { $codeRef: string };

/**
 * Code reference, represented as an async function that returns the expected value.
 */
export type CodeRef<TValue = unknown> = () => Promise<TValue>;

export type CodeRefsToValues<T> = T extends CodeRef<infer TValue>
  ? TValue
  : T extends (infer U)[]
  ? CodeRefsToValues<U>[]
  : T extends object
  ? MapCodeRefsToValues<T>
  : T;

export type MapCodeRefsToValues<T extends object> = {
  [K in keyof T]: CodeRefsToValues<T[K]>;
};

export type CodeRefsToEncodedCodeRefs<T> = T extends CodeRef
  ? EncodedCodeRef
  : T extends (infer U)[]
  ? CodeRefsToEncodedCodeRefs<U>[]
  : T extends object
  ? MapCodeRefsToEncodedCodeRefs<T>
  : T;

export type MapCodeRefsToEncodedCodeRefs<T extends object> = {
  [K in keyof T]: CodeRefsToEncodedCodeRefs<T[K]>;
};

/**
 * Infer the properties type from extension type `T`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractExtensionProperties<T> = T extends Extension<any, infer TProperties>
  ? TProperties
  : never;

/**
 * Modify `TExtension` type by replacing `CodeRef<T>` property values with `T` values.
 */
export type ResolvedExtension<TExtension extends Extension = Extension> = ReplaceProperties<
  TExtension,
  {
    properties: ReplaceProperties<
      ExtractExtensionProperties<TExtension>,
      MapCodeRefsToValues<ExtractExtensionProperties<TExtension>>
    >;
  }
>;

/**
 * Modify `TExtension` type by replacing `CodeRef` property values with `EncodedCodeRef` values.
 */
export type EncodedExtension<TExtension extends Extension = Extension> = ReplaceProperties<
  TExtension,
  {
    properties: ReplaceProperties<
      ExtractExtensionProperties<TExtension>,
      MapCodeRefsToEncodedCodeRefs<ExtractExtensionProperties<TExtension>>
    >;
  }
>;
