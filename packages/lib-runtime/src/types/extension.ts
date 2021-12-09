import type { AnyObject } from './common';

export type Extension<TProperties extends AnyObject = AnyObject> = {
  type: string;
  properties: TProperties;
  [customProperty: string]: unknown;
};

export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
  [customProperty: string]: unknown;
};

export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;
