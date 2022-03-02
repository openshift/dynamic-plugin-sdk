import { REMOTE_ENTRY_SCRIPT, REMOTE_ENTRY_CALLBACK } from '@openshift/dynamic-plugin-sdk';
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
          compilation.updateAsset(REMOTE_ENTRY_SCRIPT, (source) => {
            const newSource = new webpack.sources.ReplaceSource(source);
            const fromIndex = source.source().toString().indexOf(`${REMOTE_ENTRY_CALLBACK}(`);

            if (fromIndex >= 0) {
              newSource.insert(
                fromIndex + REMOTE_ENTRY_CALLBACK.length + 1,
                `'${this.pluginName}', `,
              );
            } else {
              const error = new webpack.WebpackError(
                `Missing call to ${REMOTE_ENTRY_CALLBACK} in ${REMOTE_ENTRY_SCRIPT}`,
              );
              error.file = REMOTE_ENTRY_SCRIPT;
              compilation.errors.push(error);
            }

            return newSource;
          });
        },
      );
    });
  }
}
