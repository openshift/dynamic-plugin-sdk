import type { RemotePluginManifest } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import type { WebpackPluginInstance, Compiler } from 'webpack';
import { Compilation, sources, WebpackError } from 'webpack';
import { findPluginChunks, getChunkFiles } from '../utils/plugin-chunks';

type InputManifestData = Omit<RemotePluginManifest, 'baseURL' | 'loadScripts' | 'buildHash'>;

type GenerateManifestPluginOptions = {
  containerName: string;
  manifestFilename: string;
  manifestData: InputManifestData;
  transformManifest: (manifest: RemotePluginManifest) => RemotePluginManifest;
};

export class GenerateManifestPlugin implements WebpackPluginInstance {
  constructor(private readonly options: GenerateManifestPluginOptions) {}

  apply(compiler: Compiler) {
    const { containerName, manifestFilename, manifestData, transformManifest } = this.options;
    const { publicPath } = compiler.options.output;

    if (!publicPath) {
      throw new Error(
        'output.publicPath option must be set to ensure plugin assets are loaded properly in the browser',
      );
    }

    compiler.hooks.thisCompilation.tap(GenerateManifestPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: GenerateManifestPlugin.name,
          // Using one of the later asset processing stages to ensure all assets
          // are already added and optimized within the given webpack compilation
          stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        () => {
          const { entryChunk, runtimeChunk } = findPluginChunks(containerName, compilation);
          const pluginChunks = runtimeChunk ? [runtimeChunk, entryChunk] : [entryChunk];

          const loadScripts = pluginChunks.reduce<string[]>(
            (acc, chunk) => [...acc, ...getChunkFiles(chunk, compilation)],
            [],
          );

          const manifest = transformManifest({
            ...manifestData,
            baseURL: compilation.getAssetPath(publicPath, {}),
            loadScripts,
            buildHash: compilation.fullHash,
          });

          const manifestContent = JSON.stringify(
            manifest,
            null,
            compiler.options.mode === 'production' ? undefined : 2,
          );

          compilation.emitAsset(
            manifestFilename,
            new sources.RawSource(Buffer.from(manifestContent)),
          );

          const warnings: string[] = [];

          if (manifest.extensions.length === 0) {
            warnings.push('Plugin has no extensions');
          }

          if (!manifest.baseURL.endsWith('/')) {
            warnings.push('Plugin base URL (output.publicPath) should have a trailing slash');
          }

          warnings.forEach((message) => {
            const error = new WebpackError(message);
            error.file = manifestFilename;
            compilation.warnings.push(error);
          });
        },
      );
    });
  }
}
