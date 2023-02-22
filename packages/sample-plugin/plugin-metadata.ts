import type { PluginBuildMetadata } from '@openshift/dynamic-plugin-sdk-webpack';

const metadata: PluginBuildMetadata = {
  name: 'sample-plugin',
  version: '1.2.3',
  dependencies: {
    'sample-app': '^1.0.0',
  },
  exposedModules: {
    telemetryListener: './src/telemetry-listener',
  },
  customProperties: {
    test: true,
  },
};

export default metadata;
