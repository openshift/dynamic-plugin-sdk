import type { AnyObject, ReplaceProperties } from '@monorepo/common';

export type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

export type Extension<TType extends string = string, TProperties extends AnyObject = AnyObject> = {
  type: TType;
  properties: TProperties;
  flags?: ExtensionFlags;
  [customProperty: string]: unknown;
};

export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
};

export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;

export type EncodedCodeRef = { $codeRef: string };

export type CodeRef<TValue = unknown> = () => Promise<TValue>;

// TODO(vojtech): apply the recursive part only on object properties or array elements
export type MapCodeRefsToValues<T> = {
  [K in keyof T]: T[K] extends CodeRef<infer TValue> ? TValue : MapCodeRefsToValues<T[K]>;
};

// TODO(vojtech): apply the recursive part only on object properties or array elements
export type MapCodeRefsToEncodedCodeRefs<T> = {
  [K in keyof T]: T[K] extends CodeRef ? EncodedCodeRef : MapCodeRefsToEncodedCodeRefs<T[K]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractExtensionProperties<T> = T extends Extension<any, infer TProperties>
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
