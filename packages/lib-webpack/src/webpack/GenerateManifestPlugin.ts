import type { PluginManifest } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import { WebpackPluginInstance, Compiler, Compilation, sources, WebpackError } from 'webpack';
import { findPluginChunks } from '../utils/plugin-chunks';

export class GenerateManifestPlugin implements WebpackPluginInstance {
  constructor(
    private readonly containerName: string,
    private readonly manifestFilename: string,
    private readonly manifestData: Omit<PluginManifest, 'loadScripts' | 'buildHash'>,
  ) {}

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(GenerateManifestPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: GenerateManifestPlugin.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const { entryChunk, runtimeChunk } = findPluginChunks(this.containerName, compilation);

          const loadScripts = (runtimeChunk ? [runtimeChunk, entryChunk] : [entryChunk]).reduce<
            string[]
          >((acc, chunk) => [...acc, ...chunk.files], []);

          const manifest: PluginManifest = {
            ...this.manifestData,
            loadScripts,
            buildHash: compilation.fullHash,
          };

          compilation.emitAsset(
            this.manifestFilename,
            new sources.RawSource(Buffer.from(JSON.stringify(manifest, null, 2))),
          );

          if (manifest.extensions.length === 0) {
            const error = new WebpackError('Plugin manifest has no extensions');
            error.file = this.manifestFilename;
            compilation.warnings.push(error);
          }
        },
      );
    });
  }
}
