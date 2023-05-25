import { DEFAULT_REMOTE_ENTRY_CALLBACK } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
import { isEmpty, mapValues, cloneDeep } from 'lodash';
import * as yup from 'yup';
import { WebpackPluginInstance, Compiler, Configuration, container, Compilation, PathData, AssetInfo } from 'webpack';
import { UniversalFederationPlugin } from '@module-federation/node'
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
  sharedScope: string;
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
   * Flag to plugin build output to be compatible with SSR
   * Default value `false`
   */
  isServer?: boolean;

  /**
   * Flag to add additional compiler run to emit entries for SSR
   * Default value `false`
   */
  emitServer?: boolean;
};

type ChunkConfig = string | ((pathData: PathData, assetInfo?: AssetInfo) => string)

// adds suffix to emitted asset name templates, this is required to differentiate between client and server assets
function replaceOutputName(template?: ChunkConfig, suffix = '.server'): typeof template extends string ? string : ChunkConfig {
  if(!template) {
    return '[name].server[ext]'
  }

  if(typeof template === 'string') {
    // replace [ext] with .server[ext]
    return template.replace(/\.[^\.]+$/, (match) => `${suffix}${match}`)
  }

  return (...args: Parameters<typeof template>) => {
    const result = template(...args)
    return result ? result.replace(/\.[^\.]+$/, (match) => `${suffix}${match}`) : '[name].server[ext]'
  }
}

function createServerCompiler(compiler: Compiler, mainCompilation: Compilation, mainOptions: DynamicRemotePluginOptions) {
  // new compiler has to be created because the entire configuration of the parent compiler has to be adjusted
  // child compilation allows only the output settings to be modified, but rest of the configuration has to be the same
  const wp = compiler.webpack
  // options have to be cloned, simple JS spread {...} will preserver parent config references and these can't be changed here
  const serverOptions = cloneDeep(compiler.options)
  // add server suffix to chunks
  const chunkFilename = replaceOutputName(mainCompilation.outputOptions.chunkFilename, '.server.')
  const assetModuleFilename = replaceOutputName(mainCompilation.outputOptions.assetModuleFilename, '.server.')

  // create server build webpack configuration
  const configuration: Configuration = {
    ...serverOptions,
    entry: {},
    target: false,
    output: {
      ...serverOptions.output,
      chunkFilename,
      assetModuleFilename
    }
  }

  // do not include original DynamicRemotePlugin, will cause duplicate entry config issues
  configuration.plugins = configuration.plugins?.filter(item => {
    return !(item instanceof DynamicRemotePlugin)
  })

  const DynamicPlugin = new DynamicRemotePlugin({
    ...mainOptions,
    // mutate server specific plugin configuration
    entryScriptFilename: replaceOutputName(mainOptions.entryScriptFilename) as string,
    isServer: true,
    emitServer: false,
  })
  configuration.plugins?.push(DynamicPlugin)
  const serverCompiler = wp(configuration)

  const {
    pluginMetadata,
    pluginManifestFilename,
    extensions
  } = mainOptions


  // create server specific manifest plugin
  new GenerateManifestPlugin(pluginMetadata.name, replaceOutputName(pluginManifestFilename ?? DEFAULT_MANIFEST) as string, {
    name: pluginMetadata.name,
    version: pluginMetadata.version,
    dependencies: pluginMetadata.dependencies,
    customProperties: pluginMetadata.customProperties,
    extensions: extensions,
    registrationMethod: 'custom',
  }).apply(serverCompiler);

  const run = () => serverCompiler.run((err, stats) => {
    if(err) {
      throw err
    }
    process.stdout.write(stats?.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
     }) + '\n')

     if (stats?.hasErrors()) {
      console.log('Build failed with errors.\n')
      process.exit(1)
     }
  })

  // return compiler and wrapped run function for further use
  return {compiler: serverCompiler, run}
}

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
      isServer: options.isServer ?? false,
      emitServer: options.emitServer ?? false
    };

    try {
      dynamicRemotePluginAdaptedOptionsSchema
        .strict(true)
        .validateSync(this.adaptedOptions, { abortEarly: false });
    } catch (e) {
      throw new Error(
        `Invalid ${DynamicRemotePlugin.name} options:\n` +
          (e as yup.ValidationError).errors.join('\n'),
      );
    }
  }

  apply(compiler: Compiler) {
    let serverCompiler: {compiler?: Compiler, run?: () => void}={};
    const {
      pluginMetadata,
      extensions,
      sharedModules,
      moduleFederationSettings,
      entryCallbackSettings,
      entryScriptFilename,
      isServer,
      emitServer,
      pluginManifestFilename,
    } = this.adaptedOptions;

    // create server compiler if flags are set immediately after compilation was created
    if(emitServer && !isServer) {
      compiler.hooks.compilation.tap('SDKServerCompilation', mainCompilation => {
        serverCompiler = createServerCompiler(compiler, mainCompilation, this.adaptedOptions)
      })
    }

    compiler.hooks.afterEmit.tap("SDKSingleManifestEntryPoint", (_clientCompilation) => {
      if(serverCompiler.compiler && serverCompiler.run) {
        // tap into server compilation hooks here if required
        // we could use this nested hook to generate single plugin manifest
        // start the server compiler run
        serverCompiler.run()        
      }
    })

    const containerName = pluginMetadata.name;

    const moduleFederationLibraryType = moduleFederationSettings.libraryType ?? 'jsonp';
    const moduleFederationSharedScope = moduleFederationSettings.sharedScope ?? 'default';

    const entryCallbackName = entryCallbackSettings.name ?? DEFAULT_REMOTE_ENTRY_CALLBACK;
    const entryCallbackPluginID = entryCallbackSettings.pluginID ?? pluginMetadata.name;

    const jsonp = moduleFederationLibraryType === 'jsonp';

    // Enforce commonjs-module for server version
    const containerLibrary = isServer ? {
      type: 'commonjs-module',
      name: containerName
    } : {
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
    new UniversalFederationPlugin({
      name: containerName,
      library: containerLibrary,
      filename: entryScriptFilename,
      exposes: containerModules,
      shared: sharedModules,
      shareScope: moduleFederationSharedScope,
      isServer,
    }, {}).apply(compiler);

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
    // Do not emit default plugin manifest for server build
    if(!isServer) {
      new GenerateManifestPlugin(containerName, pluginManifestFilename, {
        name: pluginMetadata.name,
        version: pluginMetadata.version,
        dependencies: pluginMetadata.dependencies,
        customProperties: pluginMetadata.customProperties,
        extensions,
        registrationMethod: jsonp ? 'callback' : 'custom',
      }).apply(compiler);
    }

    // Post-process container entry generated by ModuleFederationPlugin
    if (!isServer && jsonp) {
      new PatchEntryCallbackPlugin(containerName, entryCallbackName, entryCallbackPluginID).apply(
        compiler,
      );
    }

    // Validate webpack compilation
    new ValidateCompilationPlugin(containerName, jsonp).apply(compiler);
  }
}
