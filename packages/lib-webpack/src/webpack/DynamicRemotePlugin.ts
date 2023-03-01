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
 * Settings for the webpack `ModuleFederationPlugin`.
 */
export type PluginModuleFederationSettings = Partial<{
  /**
   * Configure how the plugin entry module will be exposed at runtime.
   *
   * This value is passed to `ModuleFederationPlugin` as `library.type`.
   *
   * Note that `library.name` will be set to the name of the plugin.
   *
   * Default value: `jsonp`.
   *
   * @see https://webpack.js.org/configuration/output/#outputlibrarytype
   */
  libraryType: string;

  /**
   * The name of webpack share scope object used to share modules between the host
   * application and its plugins.
   *
   * This option applies only if the target host application is built with webpack
   * and uses dedicated webpack specific APIs such as `__webpack_init_sharing__`
   * and `__webpack_share_scopes__` to initialize and access this object.
   *
   * If the target host application is not built with webpack, plugins will not be
   * able to contribute new modules into the share scope object; however, plugins
   * will still be able to use any application provided shared modules.
   *
   * Default value: `default`.
   *
   * @see https://webpack.js.org/plugins/module-federation-plugin/#sharescope
   */
  sharedScope: string;
}>;

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
   * Customize the webpack `ModuleFederationPlugin` options.
   */
  moduleFederationSettings: PluginModuleFederationSettings;

  /**
   * Customize the call to global callback function in the plugin entry script.
   *
   * This option applies only if the module federation library type is `jsonp`.
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

  private readonly moduleFederationSettings: PluginModuleFederationSettings;

  private readonly entryCallbackSettings: PluginEntryCallbackSettings;

  private readonly entryScriptFilename: string;

  private readonly pluginManifestFilename: string;

  constructor(options: DynamicRemotePluginOptions = {}) {
    const adaptedOptions: Required<DynamicRemotePluginOptions> = {
      pluginMetadata: options.pluginMetadata ?? 'plugin-metadata.json',
      extensions: options.extensions ?? 'plugin-extensions.json',
      sharedModules: options.sharedModules ?? {},
      moduleFederationSettings: options.moduleFederationSettings ?? {},
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
    this.moduleFederationSettings = adaptedOptions.moduleFederationSettings;
    this.entryCallbackSettings = adaptedOptions.entryCallbackSettings;
    this.entryScriptFilename = adaptedOptions.entryScriptFilename;
    this.pluginManifestFilename = adaptedOptions.pluginManifestFilename;
  }

  apply(compiler: Compiler) {
    const containerName = this.pluginMetadata.name;

    const moduleFederationLibraryType = this.moduleFederationSettings.libraryType ?? 'jsonp';
    const moduleFederationSharedScope = this.moduleFederationSettings.sharedScope ?? 'default';

    const entryCallbackName = this.entryCallbackSettings.name ?? DEFAULT_REMOTE_ENTRY_CALLBACK;
    const entryCallbackPluginID = this.entryCallbackSettings.pluginID ?? this.pluginMetadata.name;

    const jsonp = moduleFederationLibraryType === 'jsonp';

    const containerLibrary = {
      type: moduleFederationLibraryType,
      name: jsonp ? entryCallbackName : containerName,
    };

    const containerModules = _.mapValues(
      this.pluginMetadata.exposedModules || {},
      (moduleRequest, moduleName) => ({
        import: moduleRequest,
        name: `exposed-${moduleName}`,
      }),
    );

    // Assign a unique name for the webpack build
    compiler.options.output.uniqueName ??= containerName;

    // Generate webpack federated module container assets
    new container.ModuleFederationPlugin({
      name: containerName,
      library: containerLibrary,
      filename: this.entryScriptFilename,
      exposes: containerModules,
      shared: this.sharedModules,
      shareScope: moduleFederationSharedScope,
    }).apply(compiler);

    // ModuleFederationPlugin does not generate a container entry when the provided
    // exposes option is empty; we fix that by invoking the ContainerPlugin manually
    if (_.isEmpty(containerModules)) {
      new container.ContainerPlugin({
        name: containerName,
        library: containerLibrary,
        filename: this.entryScriptFilename,
        exposes: containerModules,
        shareScope: moduleFederationSharedScope,
      }).apply(compiler);
    }

    // Generate plugin manifest
    new GenerateManifestPlugin(containerName, this.pluginManifestFilename, {
      name: this.pluginMetadata.name,
      version: this.pluginMetadata.version,
      dependencies: this.pluginMetadata.dependencies,
      customProperties: this.pluginMetadata.customProperties,
      extensions: this.extensions,
      registrationMethod: jsonp ? 'callback' : 'custom',
    }).apply(compiler);

    // Post-process container entry generated by ModuleFederationPlugin
    if (jsonp) {
      new PatchEntryCallbackPlugin(containerName, entryCallbackName, entryCallbackPluginID).apply(
        compiler,
      );
    }

    // Validate webpack compilation
    new ValidateCompilationPlugin(containerName, jsonp).apply(compiler);
  }
}
