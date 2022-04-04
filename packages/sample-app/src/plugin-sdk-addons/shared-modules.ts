import type {
  WebpackSharedObject,
  WebpackSharedConfig,
} from '@openshift/dynamic-plugin-sdk-webpack';

/**
 * Get a {@link WebpackSharedObject} representing shared modules provided by
 * the host application to its plugins.
 *
 * Use `customConfig` to specify additional consumer (application or plugin)
 * specific shared module configuration.
 */
export const getSampleAppSharedModules = (customConfig: WebpackSharedConfig = {}) =>
  [
    '@openshift/dynamic-plugin-sdk',
    '@patternfly/react-core',
    '@patternfly/react-table',
    'react',
    'react-dom',
  ].reduce(
    (acc, moduleRequest) => ({
      ...acc,
      [moduleRequest]: {
        ...customConfig,
        singleton: true,
      },
    }),
    {} as WebpackSharedObject,
  );
