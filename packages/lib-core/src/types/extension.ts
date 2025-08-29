import type { AnyObject, ReplaceProperties } from '@monorepo/common';

export type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

/**
 * An extension of your application.
 *
 * Each extension instance has a `type` and the corresponding parameters
 * represented by the `properties` object.
 *
 * Each extension may specify `flags` referencing feature flags which
 * are required and/or disallowed in order to put this extension into effect.
 */
export type Extension<TType extends string = string, TProperties extends AnyObject = AnyObject> = {
  type: TType;
  properties: TProperties;
  flags?: ExtensionFlags;
  [customProperty: string]: unknown;
};

/**
 * Runtime extension interface, exposing additional metadata.
 */
export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
};

/**
 * TS type guard to narrow type of the given extension to `E`.
 */
export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;

/**
 * Code reference, encoded as an object literal.
 *
 * The value of the `$codeRef` property should be formatted as `moduleName.exportName`
 * (referring to a named export) or `moduleName` (referring to the `default` export).
 */
export type EncodedCodeRef = { $codeRef: string };

/**
 * Code reference, represented by a function that returns a promise for the object `T`.
 */
export type CodeRef<TValue = unknown> = () => Promise<TValue>;

// TODO(vojtech): apply the recursive part only on object properties or array elements
export type MapCodeRefsToValues<T> = {
  [K in keyof T]: T[K] extends CodeRef<infer TValue> ? TValue : MapCodeRefsToValues<T[K]>;
};

// TODO(vojtech): apply the recursive part only on object properties or array elements
export type MapCodeRefsToEncodedCodeRefs<T> = {
  [K in keyof T]: T[K] extends CodeRef ? EncodedCodeRef : MapCodeRefsToEncodedCodeRefs<T[K]>;
};

/**
 * Infer the properties of extension `E`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractExtensionProperties<T> = T extends Extension<any, infer TProperties>
  ? TProperties
  : never;

/**
 * Update `CodeRef` properties of extension `E` to the referenced object types.
 *
 * This also coerces `E` type to `LoadedExtension` interface for runtime consumption.
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

export type EncodedExtension<TExtension extends Extension = Extension> = ReplaceProperties<
  TExtension,
  {
    properties: ReplaceProperties<
      ExtractExtensionProperties<TExtension>,
      MapCodeRefsToEncodedCodeRefs<ExtractExtensionProperties<TExtension>>
    >;
  }
>;
