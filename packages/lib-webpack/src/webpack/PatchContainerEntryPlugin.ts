import { remoteEntryScript, remoteEntryCallback } from '@openshift/dynamic-plugin-sdk';
import * as webpack from 'webpack';

export class PatchContainerEntryPlugin implements webpack.WebpackPluginInstance {
  constructor(private readonly pluginName: string) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(PatchContainerEntryPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PatchContainerEntryPlugin.name,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          compilation.updateAsset(remoteEntryScript, (source) => {
            const newSource = new webpack.sources.ReplaceSource(source);
            const fromIndex = source.source().toString().indexOf(`${remoteEntryCallback}(`);

            if (fromIndex >= 0) {
              newSource.insert(
                fromIndex + remoteEntryCallback.length + 1,
                `'${this.pluginName}', `,
              );
            } else {
              const error = new webpack.WebpackError(
                `Missing call to ${remoteEntryCallback} in ${remoteEntryScript}`,
              );
              error.file = remoteEntryScript;
              compilation.errors.push(error);
            }

            return newSource;
          });
        },
      );
    });
  }
}
