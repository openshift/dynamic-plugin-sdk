import {
  extensionArraySchema,
  remoteEntryScript,
  remoteEntryCallback,
} from '@openshift/dynamic-plugin-sdk';
import type { Extension } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as webpack from 'webpack';
import type { PluginBuildMetadata } from '../types/plugin';
import { pluginBuildMetadataSchema } from '../yup-schemas';
import { GenerateManifestPlugin } from './GenerateManifestPlugin';
import { PatchContainerEntryPlugin } from './PatchContainerEntryPlugin';

const parseJSONFile = (filePath: string) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const loadPluginMetadata = (fileName: string, baseDir = process.cwd()) => {
  const filePath = path.resolve(baseDir, fileName);
  return validatePluginMetadata(parseJSONFile(filePath));
};

const loadExtensions = (globPattern: string, baseDir = process.cwd()) => {
  const filePaths = glob.sync(globPattern, { cwd: baseDir, absolute: true, nodir: true });
  return _.flatMap(filePaths.map((filePath) => validateExtensions(parseJSONFile(filePath))));
};

const validatePluginMetadata = (obj: unknown): PluginBuildMetadata =>
  pluginBuildMetadataSchema.strict(true).validateSync(obj);

const validateExtensions = (obj: unknown): Extension[] =>
  extensionArraySchema.strict(true).validateSync(obj);

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

    // Load and validate plugin metadata
    if (typeof adaptedOptions.pluginMetadata === 'string') {
      this.pluginMetadata = loadPluginMetadata(adaptedOptions.pluginMetadata);
    } else {
      this.pluginMetadata = validatePluginMetadata(adaptedOptions.pluginMetadata);
    }

    // Load and validate extensions contributed by the plugin
    if (typeof adaptedOptions.extensions === 'string') {
      this.extensions = loadExtensions(adaptedOptions.extensions);
    } else {
      this.extensions = validateExtensions(adaptedOptions.extensions);
    }

    // Create plugin vs. host application shared module configuration
    this.sharedModules = {
      ...adaptedOptions.sharedModules,
      ...getSharedModulesWithStrictSingletonConfig(['react', 'redux']),
    };
  }

  apply(compiler: webpack.Compiler) {
    const logger = compiler.getInfrastructureLogger(DynamicRemotePlugin.name);
    const containerName = this.pluginMetadata.name;

    if (!compiler.options.output.publicPath) {
      logger.warn(
        'output.publicPath is not defined, which may cause plugin assets to not load properly in the browser',
      );
    }

    if (!compiler.options.output.uniqueName) {
      logger.info(`output.uniqueName will be set to ${containerName}`);
      compiler.options.output.uniqueName = containerName;
    }

    // Generate webpack federated module container assets
    new webpack.container.ModuleFederationPlugin({
      name: containerName,
      library: {
        type: 'jsonp',
        name: remoteEntryCallback,
      },
      filename: remoteEntryScript,
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
    new PatchContainerEntryPlugin(this.pluginMetadata.name).apply(compiler);
  }
}
