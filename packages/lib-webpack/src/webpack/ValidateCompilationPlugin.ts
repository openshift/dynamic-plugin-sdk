import { WebpackPluginInstance, Compiler, WebpackError } from 'webpack';
import { findPluginChunks } from '../utils/plugin-chunks';

export class ValidateCompilationPlugin implements WebpackPluginInstance {
  constructor(private readonly containerName: string, private readonly jsonpLibraryType: boolean) {}

  apply(compiler: Compiler) {
    compiler.hooks.done.tap(ValidateCompilationPlugin.name, ({ compilation }) => {
      const { runtimeChunk } = findPluginChunks(this.containerName, compilation);

      if (runtimeChunk) {
        const errorMessage = this.jsonpLibraryType
          ? 'Detected separate runtime chunk while using jsonp library type.\n' +
            'This configuration is not allowed since it will cause issues when reloading plugins at runtime.\n' +
            'Please update your webpack configuration to avoid emitting a separate runtime chunk.'
          : 'Detected separate runtime chunk while using non-jsonp library type.\n' +
            'This configuration is not recommended since it may cause issues when reloading plugins at runtime.\n' +
            'Consider updating your webpack configuration to avoid emitting a separate runtime chunk.';

        const error = new WebpackError(errorMessage);
        error.chunk = runtimeChunk;
        (this.jsonpLibraryType ? compilation.errors : compilation.warnings).push(error);
      }
    });
  }
}
