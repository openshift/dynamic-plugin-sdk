import {
  REMOTE_ENTRY_SCRIPT,
  REMOTE_ENTRY_CALLBACK,
  extensionArraySchema,
} from '@openshift/dynamic-plugin-sdk';
import type { Extension } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import * as glob from 'glob';
import * as path from 'path';
import * as webpack from 'webpack';
import type { PluginBuildMetadata } from '../types/plugin';
import { parseJSONFile } from '../utils/json';
import { pluginBuildMetadataSchema } from '../yup-schemas';
import { GenerateManifestPlugin } from './GenerateManifestPlugin';
import { PatchContainerEntryPlugin } from './PatchContainerEntryPlugin';

const parsePluginMetadata = (fileName: string, baseDir = process.cwd()) => {
  const filePath = path.resolve(baseDir, fileName);
  return parseJSONFile<PluginBuildMetadata>(filePath);
};

const parseExtensions = (globPattern: string, baseDir = process.cwd()) => {
  const matchedFiles = glob.sync(globPattern, { cwd: baseDir, absolute: true, nodir: true });
  return _.flatMap(matchedFiles.map((filePath) => parseJSONFile<Extension[]>(filePath)));
};

const getSharedModulesWithStrictSingletonConfig = (modules: string[]) =>
  modules.reduce((acc, moduleRequest) => {
    acc[moduleRequest] = {
      // Enforce a single version of the shared module to be used at runtime
      singleton: true,
      // Prevent plugins from using a fallback version of the shared module
      import: false,
    };
    return acc;
  }, {} as WebpackSharedModules);

/**
 * Minimal subset of webpack `SharedConfig` type.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
type WebpackSharedModuleConfig = {
  import?: string | false;
  singleton?: boolean;
};

/**
 * Equivalent to webpack `SharedObject` type.
 */
type WebpackSharedModules = { [moduleRequest: string]: WebpackSharedModuleConfig };

export type DynamicRemotePluginOptions = Partial<{
  /**
   * Plugin metadata JSON file name, or the parsed plugin metadata.
   *
   * Default value: `plugin.json`.
   */
  pluginMetadata: string | PluginBuildMetadata;

  /**
   * List of extensions contributed by the plugin.
   *
   * The value is either a `minimatch` compatible JSON file glob pattern,
   * or the parsed extensions array.
   *
   * Default value: `extensions.json`.
   */
  extensions: string | Extension[];

  /**
   * Modules shared between the host application and its plugins at runtime.
   *
   * Essential modules like `react` and `redux` will be added automatically.
   *
   * Default value: empty object.
   */
  sharedModules: WebpackSharedModules;
}>;

export class DynamicRemotePlugin implements webpack.WebpackPluginInstance {
  private readonly pluginMetadata: PluginBuildMetadata;

  private readonly extensions: Extension[];

  private readonly sharedModules: WebpackSharedModules;

  constructor(options: DynamicRemotePluginOptions = {}) {
    const adaptedOptions: Required<DynamicRemotePluginOptions> = {
      pluginMetadata: options.pluginMetadata ?? 'plugin.json',
      extensions: options.extensions ?? 'extensions.json',
      sharedModules: options.sharedModules ?? {},
    };

    this.pluginMetadata =
      typeof adaptedOptions.pluginMetadata === 'string'
        ? parsePluginMetadata(adaptedOptions.pluginMetadata)
        : adaptedOptions.pluginMetadata;

    this.extensions =
      typeof adaptedOptions.extensions === 'string'
        ? parseExtensions(adaptedOptions.extensions)
        : adaptedOptions.extensions;

    this.sharedModules = {
      ...adaptedOptions.sharedModules,
      ...getSharedModulesWithStrictSingletonConfig(['react', 'redux']),
    };

    // Validate plugin metadata and extensions
    pluginBuildMetadataSchema.strict(true).validateSync(this.pluginMetadata);
    extensionArraySchema.strict(true).validateSync(this.extensions);
  }

  apply(compiler: webpack.Compiler) {
    const containerName = this.pluginMetadata.name;

    if (!compiler.options.output.publicPath) {
      throw new Error(
        'output.publicPath option must be set to ensure plugin assets are loaded properly in the browser',
      );
    }

    if (compiler.options.output.uniqueName) {
      throw new Error(
        'output.uniqueName option will be set automatically, do not set it in your webpack configuration',
      );
    }

    compiler.options.output.uniqueName = containerName;

    // Generate webpack federated module container assets
    new webpack.container.ModuleFederationPlugin({
      name: containerName,
      library: {
        type: 'jsonp',
        name: REMOTE_ENTRY_CALLBACK,
      },
      filename: REMOTE_ENTRY_SCRIPT,
      exposes: _.mapValues(
        this.pluginMetadata.exposedModules || {},
        (moduleRequest, moduleName) => ({
          import: moduleRequest,
          name: `exposed-${moduleName}`,
        }),
      ),
      shared: this.sharedModules,
    }).apply(compiler);

    // Generate plugin manifest
    new GenerateManifestPlugin({
      name: this.pluginMetadata.name,
      version: this.pluginMetadata.version,
      extensions: this.extensions,
    }).apply(compiler);

    // Post-process container entry generated by ModuleFederationPlugin
    new PatchContainerEntryPlugin(this.pluginMetadata.name, this.pluginMetadata.version).apply(compiler);
  }
}
