import { PLUGIN_MANIFEST } from '@openshift/dynamic-plugin-sdk';
import type { PluginManifest } from '@openshift/dynamic-plugin-sdk';
import * as webpack from 'webpack';

export class GenerateManifestPlugin implements webpack.WebpackPluginInstance {
  constructor(private readonly manifest: PluginManifest) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(GenerateManifestPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: GenerateManifestPlugin.name,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          compilation.emitAsset(
            PLUGIN_MANIFEST,
            new webpack.sources.RawSource(Buffer.from(JSON.stringify(this.manifest, null, 2))),
          );
        },
      );
    });
  }
}
