import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  moduleNameMapper: {
    'lodash-es': 'lodash',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },

  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  preset: 'ts-jest/presets/js-with-ts',

  transformIgnorePatterns: ['/node_modules/(?!(@patternfly)/)'],

  // testMatch: ['**/*.test.(js|jsx|ts|tsx)'],
  testMatch: ['**/(ReduxExtensionProvider|StatusBox).test.tsx'],

  clearMocks: true,
};

export default config;
