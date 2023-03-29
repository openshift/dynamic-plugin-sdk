import { WebpackPluginInstance, Compiler, Compilation, sources, WebpackError } from 'webpack';
import { findPluginChunks } from '../utils/plugin-chunks';

export class PatchEntryCallbackPlugin implements WebpackPluginInstance {
  constructor(
    private readonly containerName: string,
    private readonly callbackName: string,
    private readonly pluginID: string,
  ) {}

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(PatchEntryCallbackPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PatchEntryCallbackPlugin.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          const { entryChunk } = findPluginChunks(this.containerName, compilation);

          entryChunk.files.forEach((fileName) => {
            compilation.updateAsset(fileName, (source) => {
              const newSource = new sources.ReplaceSource(source);
              const fromIndex = source.source().toString().indexOf(`${this.callbackName}(`);

              if (fromIndex >= 0) {
                newSource.insert(fromIndex + this.callbackName.length + 1, `'${this.pluginID}', `);
              } else {
                const error = new WebpackError(`Missing call to ${this.callbackName}`);
                error.file = fileName;
                error.chunk = entryChunk;
                compilation.errors.push(error);
              }

              return newSource;
            });
          });
        },
      );
    });
  }
}
