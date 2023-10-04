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
  EncodedCodeRef,
  Extension,
  ExtensionFlags,
  EncodedExtension,
  MapCodeRefsToEncodedCodeRefs,
  ExtractExtensionProperties,
  PluginRegistrationMethod,
  PluginRuntimeMetadata,
  PluginManifest,
} from '@openshift/dynamic-plugin-sdk/src/shared-webpack';

export {
  DynamicRemotePlugin,
  DynamicRemotePluginOptions,
  PluginModuleFederationSettings,
  PluginEntryCallbackSettings,
} from './webpack/DynamicRemotePlugin';

export { PluginBuildMetadata } from './types/plugin';
export { WebpackSharedConfig, WebpackSharedObject } from './types/webpack';
