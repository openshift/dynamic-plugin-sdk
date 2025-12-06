import type { WebpackPluginInstance, Compiler } from 'webpack';
import { findPluginChunks } from '../utils/plugin-chunks';

type ValidateCompilationPluginOptions = {
  containerName: string;
  jsonpLibraryType: boolean;
};

export class ValidateCompilationPlugin implements WebpackPluginInstance {
  constructor(private readonly options: ValidateCompilationPluginOptions) {}

  apply(compiler: Compiler) {
    const { containerName, jsonpLibraryType } = this.options;

    compiler.hooks.done.tap(ValidateCompilationPlugin.name, ({ compilation }) => {
      const { runtimeChunk } = findPluginChunks(containerName, compilation);

      if (runtimeChunk) {
        const errorMessage = jsonpLibraryType
          ? 'Detected separate runtime chunk while using jsonp library type.\n' +
            'This configuration is not allowed since it will cause issues when reloading plugins at runtime.\n' +
            'Please update your webpack configuration to avoid emitting a separate runtime chunk.'
          : 'Detected separate runtime chunk while using non-jsonp library type.\n' +
            'This configuration is not recommended since it may cause issues when reloading plugins at runtime.\n' +
            'Consider updating your webpack configuration to avoid emitting a separate runtime chunk.';

        const error = new compiler.webpack.WebpackError(errorMessage);
        error.chunk = runtimeChunk;
        (jsonpLibraryType ? compilation.errors : compilation.warnings).push(error);
      }
    });
  }
}
