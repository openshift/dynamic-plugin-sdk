import { DEFAULT_REMOTE_ENTRY_CALLBACK } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import type {
  EncodedExtension,
  PluginManifest,
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import { identity, isEmpty, mapValues } from 'lodash';
import * as semver from 'semver';
import * as yup from 'yup';
import { WebpackPluginInstance, Compiler, container } from 'webpack';
import type { PluginBuildMetadata } from '../types/plugin';
import type { WebpackSharedObject } from '../types/webpack';
import { dynamicRemotePluginAdaptedOptionsSchema } from '../yup-schemas';
import { GenerateManifestPlugin } from './GenerateManifestPlugin';
import { PatchEntryCallbackPlugin } from './PatchEntryCallbackPlugin';
import { ValidateCompilationPlugin } from './ValidateCompilationPlugin';

const DEFAULT_MANIFEST = 'plugin-manifest.json';
const DEFAULT_ENTRY_SCRIPT = 'plugin-entry.js';

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
  sharedScopeName: string;
}>;

/**
 * Settings for the global callback function used by plugin entry scripts.
 */
export type PluginEntryCallbackSettings = Partial<{
  /**
   * Name of the callback function.
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

export type DynamicRemotePluginOptions = {
  /**
   * Plugin build metadata.
   */
  pluginMetadata: PluginBuildMetadata;

  /**
   * List of extensions contributed by the plugin.
   */
  extensions: EncodedExtension[];

  /**
   * Modules shared between the host application and its plugins at runtime.
   *
   * It is the host application's responsibility to initialize and maintain its shared
   * scope object, and to communicate information about application provided modules to
   * its plugins.
   *
   * Default value: empty object.
   */
  sharedModules?: WebpackSharedObject;

  /**
   * Customize the webpack `ModuleFederationPlugin` options.
   */
  moduleFederationSettings?: PluginModuleFederationSettings;

  /**
   * Customize the call to global callback function in the plugin entry script.
   *
   * This option applies only if the module federation library type is `jsonp`.
   */
  entryCallbackSettings?: PluginEntryCallbackSettings;

  /**
   * Customize the filename of the generated plugin entry script.
   *
   * We recommend using the `[fullhash]` placeholder in production builds.
   *
   * Default value: `plugin-entry.js`.
   *
   * @see https://webpack.js.org/configuration/output/#outputfilename
   */
  entryScriptFilename?: string;

  /**
   * Customize the filename of the generated plugin manifest.
   *
   * Default value: `plugin-manifest.json`.
   */
  pluginManifestFilename?: string;

  /**
   * Transform the plugin manifest before emitting the asset to webpack compilation.
   *
   * Environment specific properties should be set via the `customProperties` object.
   *
   * By default, no transformation is performed on the manifest.
   */
  transformPluginManifest?: (manifest: PluginManifest) => PluginManifest;
};

export class DynamicRemotePlugin implements WebpackPluginInstance {
  private readonly adaptedOptions: Required<DynamicRemotePluginOptions>;

  constructor(options: DynamicRemotePluginOptions) {
    this.adaptedOptions = {
      pluginMetadata: options.pluginMetadata,
      extensions: options.extensions,
      sharedModules: options.sharedModules ?? {},
      moduleFederationSettings: options.moduleFederationSettings ?? {},
      entryCallbackSettings: options.entryCallbackSettings ?? {},
      entryScriptFilename: options.entryScriptFilename ?? DEFAULT_ENTRY_SCRIPT,
      pluginManifestFilename: options.pluginManifestFilename ?? DEFAULT_MANIFEST,
      transformPluginManifest: options.transformPluginManifest ?? identity,
    };

    try {
      dynamicRemotePluginAdaptedOptionsSchema.validateSync(this.adaptedOptions, {
        strict: true,
        abortEarly: false,
      });
    } catch (e) {
      throw new Error(
        `Invalid ${DynamicRemotePlugin.name} options:\n` +
          (e as yup.ValidationError).errors.join('\n'),
      );
    }

    // TODO(vojtech): remove this code once the validation library supports this natively
    const invalidDepNames = Object.entries(
      this.adaptedOptions.pluginMetadata.dependencies ?? {},
    ).reduce<string[]>(
      (acc, [depName, versionRange]) => (semver.validRange(versionRange) ? acc : [...acc, depName]),
      [],
    );

    if (invalidDepNames.length > 0) {
      throw new Error(
        `Dependency values must be valid semver ranges: ${invalidDepNames.join(', ')}`,
      );
    }
  }

  apply(compiler: Compiler) {
    const {
      pluginMetadata,
      extensions,
      sharedModules,
      moduleFederationSettings,
      entryCallbackSettings,
      entryScriptFilename,
      pluginManifestFilename,
      transformPluginManifest,
    } = this.adaptedOptions;

    const containerName = pluginMetadata.name;

    const moduleFederationLibraryType = moduleFederationSettings.libraryType ?? 'jsonp';
    const moduleFederationSharedScope = moduleFederationSettings.sharedScopeName ?? 'default';

    const entryCallbackName = entryCallbackSettings.name ?? DEFAULT_REMOTE_ENTRY_CALLBACK;
    const entryCallbackPluginID = entryCallbackSettings.pluginID ?? pluginMetadata.name;

    const jsonp = moduleFederationLibraryType === 'jsonp';

    const containerLibrary = {
      type: moduleFederationLibraryType,
      name: jsonp ? entryCallbackName : containerName,
    };

    const containerModules = mapValues(
      pluginMetadata.exposedModules ?? {},
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
      filename: entryScriptFilename,
      exposes: containerModules,
      shared: sharedModules,
      shareScope: moduleFederationSharedScope,
    }).apply(compiler);

    // ModuleFederationPlugin does not generate a container entry when the provided
    // exposes option is empty; we fix that by invoking the ContainerPlugin manually
    if (isEmpty(containerModules)) {
      new container.ContainerPlugin({
        name: containerName,
        library: containerLibrary,
        filename: entryScriptFilename,
        exposes: containerModules,
        shareScope: moduleFederationSharedScope,
      }).apply(compiler);
    }

    // Generate plugin manifest
    new GenerateManifestPlugin({
      containerName,
      manifestFilename: pluginManifestFilename,
      manifestData: {
        name: pluginMetadata.name,
        version: pluginMetadata.version,
        dependencies: pluginMetadata.dependencies,
        customProperties: pluginMetadata.customProperties,
        extensions,
        registrationMethod: jsonp ? 'callback' : 'custom',
      },
      transformManifest: transformPluginManifest,
    }).apply(compiler);

    // Post-process container entry generated by ModuleFederationPlugin
    if (jsonp) {
      new PatchEntryCallbackPlugin({
        containerName,
        callbackName: entryCallbackName,
        pluginID: entryCallbackPluginID,
      }).apply(compiler);
    }

    // Validate webpack compilation
    new ValidateCompilationPlugin({ containerName, jsonpLibraryType: jsonp }).apply(compiler);
  }
}
