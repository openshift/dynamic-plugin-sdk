import type { PluginManifest } from '@openshift/dynamic-plugin-sdk/src/types/plugin';
import { WebpackPluginInstance, Compiler, Compilation, sources } from 'webpack';

export class GenerateManifestPlugin implements WebpackPluginInstance {
  constructor(private readonly fileName: string, private readonly manifest: PluginManifest) {}

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(GenerateManifestPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: GenerateManifestPlugin.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          compilation.emitAsset(
            this.fileName,
            new sources.RawSource(Buffer.from(JSON.stringify(this.manifest, null, 2))),
          );
        },
      );
    });
  }
}
