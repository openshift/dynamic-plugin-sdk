import { WebpackPluginInstance, Compiler, Compilation, sources, WebpackError } from 'webpack';
import { findPluginChunks, getChunkFiles } from '../utils/plugin-chunks';

type PatchEntryCallbackPluginOptions = {
  containerName: string;
  callbackName: string;
  pluginID: string;
};

export class PatchEntryCallbackPlugin implements WebpackPluginInstance {
  constructor(private readonly options: PatchEntryCallbackPluginOptions) {}

  apply(compiler: Compiler) {
    const { containerName, callbackName, pluginID } = this.options;

    compiler.hooks.thisCompilation.tap(PatchEntryCallbackPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PatchEntryCallbackPlugin.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          const { entryChunk } = findPluginChunks(containerName, compilation);

          getChunkFiles(entryChunk, compilation).forEach((fileName) => {
            compilation.updateAsset(fileName, (source) => {
              const newSource = new sources.ReplaceSource(source);
              const fromIndex = source.source().toString().indexOf(`${callbackName}(`);

              if (fromIndex >= 0) {
                newSource.insert(fromIndex + callbackName.length + 1, `'${pluginID}', `);
              } else {
                const error = new WebpackError(`Missing call to ${callbackName}`);
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
