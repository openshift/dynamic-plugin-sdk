import { WebpackPluginInstance, Compiler, WebpackError } from 'webpack';
import { findPluginChunks } from '../utils/plugin-chunks';

export class ValidateCompilationPlugin implements WebpackPluginInstance {
  constructor(private readonly containerName: string, private readonly jsonpLibraryType: boolean) {}

  apply(compiler: Compiler) {
    compiler.hooks.afterCompile.tap(ValidateCompilationPlugin.name, (compilation) => {
      const { runtimeChunk } = findPluginChunks(this.containerName, compilation);

      if (runtimeChunk && this.jsonpLibraryType) {
        compilation.errors.push(
          new WebpackError(
            'Detected separate runtime chunk while using jsonp library type.\n' +
              'This configuration is not allowed since it will cause issues with reloading plugins at runtime.\n' +
              'Update your webpack configuration to avoid emitting a separate runtime chunk.',
          ),
        );
      } else if (runtimeChunk) {
        compilation.warnings.push(
          new WebpackError(
            'Detected separate runtime chunk while using non-jsonp library type.\n' +
              'This configuration is not recommended since it may cause issues with reloading plugins at runtime.',
          ),
        );
      }
    });
  }
}
