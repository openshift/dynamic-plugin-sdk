import {
  DEFAULT_PLUGIN_MANIFEST,
  DEFAULT_REMOTE_ENTRY_CALLBACK,
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import * as _ from 'lodash';
import glob from 'glob';
import path from 'path';
import * as yup from 'yup';
import { WebpackPluginInstance, Compiler, container } from 'webpack';
import type { PluginBuildMetadata } from '../types/plugin';
import type { WebpackSharedObject } from '../types/webpack';
import { parseJSONFile } from '../utils/json';
import { dynamicRemotePluginAdaptedOptionsSchema } from '../yup-schemas';
import { GenerateManifestPlugin } from './GenerateManifestPlugin';
import { PatchEntryCallbackPlugin } from './PatchEntryCallbackPlugin';
import { ValidateCompilationPlugin } from './ValidateCompilationPlugin';

const parsePluginMetadata = (fileName: string, baseDir = process.cwd()) => {
  const filePath = path.resolve(baseDir, fileName);
  return parseJSONFile<PluginBuildMetadata>(filePath);
};

const parseExtensions = (globPattern: string, baseDir = process.cwd()) => {
  const matchedFiles = glob.sync(globPattern, { cwd: baseDir, absolute: true, nodir: true });
  return _.flatMap(matchedFiles.map((filePath) => parseJSONFile<EncodedExtension[]>(filePath)));
};

/**
 * Settings for the global callback function used by plugin entry scripts.
 */
export type PluginEntryCallbackSettings = Partial<{
  /**
   * Name of the function to call.
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
   * Default value: `plugin-metadata.json`.
   */
  pluginMetadata: string | PluginBuildMetadata;

  /**
   * List of extensions contributed by the plugin.
   *
   * The value is either a `minimatch` compatible JSON file glob pattern,
   * or the parsed extensions array.
   *
   * Default value: `plugin-extensions.json`.
   */
  extensions: string | EncodedExtension[];

  /**
   * Modules shared between the host application and its plugins at runtime.
   *
   * It is the host application's responsibility to initialize and maintain its shared
   * scope object, and to communicate information about application provided modules to
   * its plugins.
   *
   * Default value: empty object.
   */
  sharedModules: WebpackSharedObject;

  /**
   * Configure how the plugin entry module will be exposed at runtime.
   *
   * This value is passed to webpack `ModuleFederationPlugin` as `library.type`.
   * Note that `library.name` will be set to the name of the plugin.
   *
   * Default value: `jsonp`.
   *
   * @see https://webpack.js.org/configuration/output/#outputlibrarytype
   */
  moduleFederationLibraryType: string;

  /**
   * Customize the call to global callback function in the plugin entry script.
   *
   * This option applies only if `moduleFederationLibraryType` is `jsonp`.
   */
  entryCallbackSettings: PluginEntryCallbackSettings;

  /**
   * Customize the filename of the generated plugin entry script.
   *
   * We recommend using the `[fullhash]` placeholder in production builds.
   *
   * Default value: `plugin-entry.js`.
   *
   * @see https://webpack.js.org/configuration/output/#outputfilename
   */
  entryScriptFilename: string;

  /**
   * Customize the filename of the generated plugin manifest.
   *
   * Default value: `plugin-manifest.json`.
   */
  pluginManifestFilename: string;
}>;

export class DynamicRemotePlugin implements WebpackPluginInstance {
  private readonly pluginMetadata: PluginBuildMetadata;

  private readonly extensions: EncodedExtension[];

  private readonly sharedModules: WebpackSharedObject;

  private readonly moduleFederationLibraryType: string;

  private readonly entryCallbackSettings: PluginEntryCallbackSettings;

  private readonly entryScriptFilename: string;

  private readonly pluginManifestFilename: string;

  constructor(options: DynamicRemotePluginOptions = {}) {
    const adaptedOptions: Required<DynamicRemotePluginOptions> = {
      pluginMetadata: options.pluginMetadata ?? 'plugin-metadata.json',
      extensions: options.extensions ?? 'plugin-extensions.json',
      sharedModules: options.sharedModules ?? {},
      moduleFederationLibraryType: options.moduleFederationLibraryType ?? 'jsonp',
      entryCallbackSettings: options.entryCallbackSettings ?? {},
      entryScriptFilename: options.entryScriptFilename ?? 'plugin-entry.js',
      pluginManifestFilename: options.pluginManifestFilename ?? DEFAULT_PLUGIN_MANIFEST,
    };

    if (typeof adaptedOptions.pluginMetadata === 'string') {
      adaptedOptions.pluginMetadata = parsePluginMetadata(adaptedOptions.pluginMetadata);
    }

    if (typeof adaptedOptions.extensions === 'string') {
      adaptedOptions.extensions = parseExtensions(adaptedOptions.extensions);
    }

    try {
      dynamicRemotePluginAdaptedOptionsSchema
        .strict(true)
        .validateSync(adaptedOptions, { abortEarly: false });
    } catch (e) {
      throw new Error(
        `Invalid ${DynamicRemotePlugin.name} options:\n` +
          (e as yup.ValidationError).errors.join('\n'),
      );
    }

    this.pluginMetadata = adaptedOptions.pluginMetadata;
    this.extensions = adaptedOptions.extensions;
    this.sharedModules = adaptedOptions.sharedModules;
    this.moduleFederationLibraryType = adaptedOptions.moduleFederationLibraryType;
    this.entryCallbackSettings = adaptedOptions.entryCallbackSettings;
    this.entryScriptFilename = adaptedOptions.entryScriptFilename;
    this.pluginManifestFilename = adaptedOptions.pluginManifestFilename;
  }

  apply(compiler: Compiler) {
    if (!compiler.options.output.publicPath) {
      throw new Error(
        'output.publicPath option must be set to ensure plugin assets are loaded properly in the browser',
      );
    }

    const containerName = this.pluginMetadata.name;

    const jsonp = this.moduleFederationLibraryType === 'jsonp';
    const entryCallbackName = this.entryCallbackSettings.name ?? DEFAULT_REMOTE_ENTRY_CALLBACK;
    const entryCallbackPluginID = this.entryCallbackSettings.pluginID ?? this.pluginMetadata.name;

    // Assign a unique name for the webpack build
    compiler.options.output.uniqueName ??= containerName;

    // Generate webpack federated module container assets
    new container.ModuleFederationPlugin({
      name: containerName,
      library: {
        type: this.moduleFederationLibraryType,
        name: jsonp ? entryCallbackName : containerName,
      },
      filename: this.entryScriptFilename,
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
    new GenerateManifestPlugin(containerName, this.pluginManifestFilename, {
      name: this.pluginMetadata.name,
      version: this.pluginMetadata.version,
      dependencies: this.pluginMetadata.dependencies,
      extensions: this.extensions,
      registrationMethod: jsonp ? 'callback' : 'custom',
    }).apply(compiler);

    if (jsonp) {
      // Post-process container entry generated by webpack ModuleFederationPlugin
      new PatchEntryCallbackPlugin(containerName, entryCallbackName, entryCallbackPluginID).apply(
        compiler,
      );
    }

    // Validate webpack compilation
    new ValidateCompilationPlugin(containerName, jsonp).apply(compiler);
  }
}
