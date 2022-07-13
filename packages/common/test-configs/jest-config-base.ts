import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  preset: 'ts-jest/presets/js-with-ts',

  testMatch: ['**/*.test.(js|jsx|ts|tsx)'],
  transformIgnorePatterns: ['/node_modules/(?!(@patternfly)/)'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    'lodash-es': 'lodash',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },

  clearMocks: true,
};

export default config;
