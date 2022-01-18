import type { AnyObject } from '@monorepo/common';

export type EncodedCodeRef = { $codeRef: string };

export type CodeRef<T = unknown> = () => Promise<T>;

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
