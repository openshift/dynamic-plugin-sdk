import { AnyObject } from './common';

export type Extension<TProperties extends AnyObject = AnyObject> = {
  type: string;
  properties: TProperties;
};

export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
};
