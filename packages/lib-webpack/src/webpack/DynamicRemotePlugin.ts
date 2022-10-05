import {
  PLUGIN_MANIFEST,
  REMOTE_ENTRY_SCRIPT,
  REMOTE_ENTRY_CALLBACK,
} from '@openshift/dynamic-plugin-sdk/src/constants';
import { extensionArraySchema } from '@openshift/dynamic-plugin-sdk/src/yup-schemas';
import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk/src/types/extension';
import * as _ from 'lodash-es';
import glob from 'glob';
import path from 'path';
import { WebpackPluginInstance, Compiler, container } from 'webpack';
import type { PluginBuildMetadata } from '../types/plugin';
import type { WebpackSharedObject } from '../types/webpack';
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
  return _.flatMap(matchedFiles.map((filePath) => parseJSONFile<EncodedExtension[]>(filePath)));
};

const validatePluginMetadata = (pluginMetadata: PluginBuildMetadata) => {
  pluginBuildMetadataSchema.strict(true).validateSync(pluginMetadata);
};

const validateExtensions = (extensions: EncodedExtension[]) => {
  extensionArraySchema.strict(true).validateSync(extensions);
};

/**
 * Settings for the global callback function used by plugin entry scripts.
 */
type PluginEntryCallbackSettings = Partial<{
  /**
   * Name of the function.
   *
   * Default value: `__load_plugin_entry__`.
   */
  name: string;

  /**
   * Plugin identifier, passed as the first argument.
   *
   * Default value: plugin name, as specified in the plugin metadata.
   */
  pluginID: string;
}>;

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
  extensions: string | EncodedExtension[];

  /**
   * Modules shared between the host application and its plugins at runtime.
   *
   * Default value: empty object.
   */
  sharedModules: WebpackSharedObject;

  /**
   * Customize the global callback function used by plugin entry scripts.
   *
   * See {@link PluginEntryCallbackSettings} properties and their defaults.
   */
  entryCallbackSettings: PluginEntryCallbackSettings;
}>;

export class DynamicRemotePlugin implements WebpackPluginInstance {
  private readonly pluginMetadata: PluginBuildMetadata;

  private readonly extensions: EncodedExtension[];

  private readonly sharedModules: WebpackSharedObject;

  private readonly entryCallbackSettings: Required<PluginEntryCallbackSettings>;

  constructor(options: DynamicRemotePluginOptions = {}) {
    const adaptedOptions: Required<DynamicRemotePluginOptions> = {
      pluginMetadata: options.pluginMetadata ?? 'plugin.json',
      extensions: options.extensions ?? 'extensions.json',
      sharedModules: options.sharedModules ?? {},
      entryCallbackSettings: options.entryCallbackSettings ?? {},
    };

    this.pluginMetadata =
      typeof adaptedOptions.pluginMetadata === 'string'
        ? parsePluginMetadata(adaptedOptions.pluginMetadata)
        : adaptedOptions.pluginMetadata;

    validatePluginMetadata(this.pluginMetadata);

    this.extensions =
      typeof adaptedOptions.extensions === 'string'
        ? parseExtensions(adaptedOptions.extensions)
        : adaptedOptions.extensions;

    validateExtensions(this.extensions);

    this.sharedModules = adaptedOptions.sharedModules;

    this.entryCallbackSettings = {
      name: adaptedOptions.entryCallbackSettings.name ?? REMOTE_ENTRY_CALLBACK,
      pluginID: adaptedOptions.entryCallbackSettings.pluginID ?? this.pluginMetadata.name,
    };
  }

  apply(compiler: Compiler) {
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
    new container.ModuleFederationPlugin({
      name: containerName,
      library: {
        type: 'jsonp',
        name: this.entryCallbackSettings.name,
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
    new GenerateManifestPlugin(PLUGIN_MANIFEST, {
      name: this.pluginMetadata.name,
      version: this.pluginMetadata.version,
      dependencies: this.pluginMetadata.dependencies,
      extensions: this.extensions,
    }).apply(compiler);

    // Post-process container entry generated by ModuleFederationPlugin
    new PatchContainerEntryPlugin(
      REMOTE_ENTRY_SCRIPT,
      this.entryCallbackSettings.name,
      this.entryCallbackSettings.pluginID,
    ).apply(compiler);
  }
}
