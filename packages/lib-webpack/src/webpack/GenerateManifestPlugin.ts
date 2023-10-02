import type {
  PluginManifest,
  TransformPluginManifest,
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import { WebpackPluginInstance, Compiler, Compilation, sources, WebpackError } from 'webpack';
import { findPluginChunks } from '../utils/plugin-chunks';

type InputManifestData = Omit<PluginManifest, 'baseURL' | 'loadScripts' | 'buildHash'>;

type GenerateManifestPluginOptions = {
  containerName: string;
  manifestFilename: string;
  manifestData: InputManifestData;
  transformManifest: TransformPluginManifest;
};

export class GenerateManifestPlugin implements WebpackPluginInstance {
  constructor(private readonly options: GenerateManifestPluginOptions) {}

  apply(compiler: Compiler) {
    const { containerName, manifestFilename, manifestData, transformManifest } = this.options;
    const publicPath = compiler.options.output.publicPath;

    if (!publicPath) {
      throw new Error(
        'output.publicPath option must be set to ensure plugin assets are loaded properly in the browser',
      );
    }

    compiler.hooks.thisCompilation.tap(GenerateManifestPlugin.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: GenerateManifestPlugin.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const { entryChunk, runtimeChunk } = findPluginChunks(containerName, compilation);

          const loadScripts = (runtimeChunk ? [runtimeChunk, entryChunk] : [entryChunk]).reduce<
            string[]
          >((acc, chunk) => [...acc, ...chunk.files], []);

          const manifest = transformManifest({
            ...manifestData,
            baseURL: compilation.getAssetPath(publicPath, {}),
            loadScripts,
            buildHash: compilation.fullHash,
          });

          compilation.emitAsset(
            manifestFilename,
            new sources.RawSource(Buffer.from(JSON.stringify(manifest, null, 2))),
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
