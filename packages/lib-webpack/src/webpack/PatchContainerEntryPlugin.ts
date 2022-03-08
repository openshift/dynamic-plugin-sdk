import webpack from 'webpack';

export class PatchContainerEntryPlugin implements webpack.WebpackPluginInstance {
  constructor(
    private readonly fileName: string,
    private readonly callbackName: string,
    private readonly pluginID: string,
  ) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(PatchContainerEntryPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PatchContainerEntryPlugin.name,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          compilation.updateAsset(this.fileName, (source) => {
            const newSource = new webpack.sources.ReplaceSource(source);
            const fromIndex = source.source().toString().indexOf(`${this.callbackName}(`);

            if (fromIndex >= 0) {
              newSource.insert(fromIndex + this.callbackName.length + 1, `'${this.pluginID}', `);
            } else {
              const error = new webpack.WebpackError(
                `Missing call to ${this.callbackName} in ${this.fileName}`,
              );
              error.file = this.fileName;
              compilation.errors.push(error);
            }

            return newSource;
          });
        },
      );
    });
  }
}
