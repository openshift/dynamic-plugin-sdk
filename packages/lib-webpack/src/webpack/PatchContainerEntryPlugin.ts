import { WebpackPluginInstance, Compiler, Compilation, sources, WebpackError } from 'webpack';
import findPluginEntry from '../utils/findPluginEntry';

export class PatchContainerEntryPlugin implements WebpackPluginInstance {
  constructor(
    private readonly containerName: string,
    private readonly callbackName: string,
    private readonly pluginID: string,
    private readonly registrationMethod: 'jsonp' | 'var'
  ) {}

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(PatchContainerEntryPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PatchContainerEntryPlugin.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          const { entryChunkName } = findPluginEntry(this.containerName, compilation.chunks)
          if(!entryChunkName) {
            const error = new WebpackError (
              `Unable to find plugin entry point ${this.containerName}`
            )

            compilation.errors.push(error)
          } else {

            compilation.updateAsset(entryChunkName, (source) => {
              if(this.registrationMethod === 'jsonp') {
                const newSource = new sources.ReplaceSource(source);
                const fromIndex = source.source().toString().indexOf(`${this.callbackName}(`);

                if (fromIndex >= 0) {
                  newSource.insert(fromIndex + this.callbackName.length + 1, `'${this.pluginID}', `);
                } else {
                  const error = new WebpackError(
                    `Missing call to ${this.callbackName} in ${entryChunkName}`,
                  );
                  error.file = entryChunkName;
                  compilation.errors.push(error);
                }

                return newSource;
              }

              return source
            });
          }
        },
      );
    });
  }
}
