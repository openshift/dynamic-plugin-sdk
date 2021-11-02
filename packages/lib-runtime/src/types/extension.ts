export type Extension<TProperties extends {} = {}> = {
  type: string;
  properties: TProperties;
};

export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  uid: string;
  pluginName: string;
};
