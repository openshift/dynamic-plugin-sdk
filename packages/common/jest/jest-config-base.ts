import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  preset: 'ts-jest/presets/js-with-ts',

  testMatch: ['**/*.test.(js|jsx|ts|tsx)'],

  // Allow transforming ESM-only packages like uuid
  transformIgnorePatterns: ['/node_modules/(?!uuid/)'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
  },

  clearMocks: true,
};

export default config;
