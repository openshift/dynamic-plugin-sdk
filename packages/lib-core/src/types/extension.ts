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
