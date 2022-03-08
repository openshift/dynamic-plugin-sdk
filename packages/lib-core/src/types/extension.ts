import type { AnyObject, ReplaceProperties } from '@monorepo/common';

export type Extension<TType extends string = string, TProperties extends AnyObject = AnyObject> = {
  type: TType;
  properties: TProperties;
  [customProperty: string]: unknown;
};

export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
  [customProperty: string]: unknown;
};

export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;

export type EncodedCodeRef = { $codeRef: string };

export type CodeRef<TValue = unknown> = () => Promise<TValue>;

// TODO(vojtech): apply the recursive part only on object properties or array elements
type MapCodeRefsToValues<T> = {
  [K in keyof T]: T[K] extends CodeRef<infer TValue> ? TValue : MapCodeRefsToValues<T[K]>;
};

// TODO(vojtech): apply the recursive part only on object properties or array elements
type MapCodeRefsToEncodedCodeRefs<T> = {
  [K in keyof T]: T[K] extends CodeRef ? EncodedCodeRef : MapCodeRefsToEncodedCodeRefs<T[K]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractExtensionProperties<T> = T extends Extension<any, infer TProperties>
  ? TProperties
  : never;

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
