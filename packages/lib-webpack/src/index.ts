/**
 * webpack tools for building dynamic plugin assets.
 *
 * @remarks
 * This package allows building dynamic plugins with webpack based on the concept
 * of {@link https://webpack.js.org/concepts/module-federation/ | module federation}.
 *
 * @packageDocumentation
 */

export { AnyObject, ReplaceProperties } from '@monorepo/common';
export {
  CodeRef,
  CodeRefsToEncodedCodeRefs,
  EncodedCodeRef,
  EncodedExtension,
  Extension,
  ExtensionFlags,
  ExtractExtensionProperties,
  MapCodeRefsToEncodedCodeRefs,
  PluginCustomProperties,
  PluginRuntimeMetadata,
  RemotePluginManifest,
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';
export { PluginBuildMetadata } from './types/plugin';
export { WebpackSharedConfig, WebpackSharedObject } from './types/webpack';
export {
  DynamicRemotePlugin,
  DynamicRemotePluginOptions,
  PluginEntryCallbackSettings,
  PluginModuleFederationSettings,
} from './webpack/DynamicRemotePlugin';
