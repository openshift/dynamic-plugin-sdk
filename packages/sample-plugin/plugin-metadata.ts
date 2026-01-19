import type { SupportedCustomProperties } from '@monorepo/sample-app/src/types';
import type { PluginBuildMetadata } from '@openshift/dynamic-plugin-sdk-webpack';

const metadata: PluginBuildMetadata = {
  name: 'sample-plugin',
  version: '1.2.3',
  dependencies: {
    'sample-app': '^1.0.0',
  },
  exposedModules: {
    testComponent: './src/test-component',
  },
  customProperties: {
    sampleApp: {
      greeting: 'Greetings from sample plugin',
    },
  } as SupportedCustomProperties,
};

export default metadata;
