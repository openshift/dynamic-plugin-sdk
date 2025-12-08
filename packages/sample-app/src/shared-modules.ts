import type { WebpackSharedObject } from '@openshift/dynamic-plugin-sdk-webpack';

/**
 * Shared modules provided by the host application to its plugins.
 *
 * `eager: true` means include the module in the application's initial chunk.
 * We generally want this for all shared modules provided by the application.
 *
 * `singleton: true` means allow only a single version of the module to be loaded.
 * We want this for libraries which are meant to be used as singletons, including
 * the ones which rely on global state.
 *
 * `requiredVersion` can be used to manually specify the required module version
 * as a semver range or `false` to skip the version check.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
export const appSharedModules: WebpackSharedObject = {
  '@openshift/dynamic-plugin-sdk': { eager: true, singleton: true, requiredVersion: false },
  '@patternfly/react-core': { eager: true },
  '@patternfly/react-table': { eager: true },
  react: { eager: true, singleton: true, requiredVersion: '^17.0.0' },
  'react-dom': { eager: true, singleton: true, requiredVersion: '^17.0.0' },
};

/**
 * Equivalent to {@link appSharedModules} from a plugin's perspective.
 *
 * A host application typically provides some modules to its plugins. If an application
 * provided module is configured as an eager singleton, we suggest using `import: false`
 * to avoid bundling a fallback version of the module when building your plugin.
 *
 * Plugins may provide additional shared modules that can be consumed by other plugins.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
export const pluginSharedModules: WebpackSharedObject = {
  '@openshift/dynamic-plugin-sdk': { singleton: true, import: false },
  '@patternfly/react-core': {},
  '@patternfly/react-table': {},
  react: { singleton: true, import: false },
  'react-dom': { singleton: true, import: false },
};
