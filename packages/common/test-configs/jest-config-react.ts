import path from 'path';
import type { InitialOptionsTsJest } from 'ts-jest';
import baseConfig from './jest-config-base';

const config: InitialOptionsTsJest = {
  ...baseConfig,
  testEnvironment: 'jsdom',

  // https://github.com/jsdom/jsdom#simple-options
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },

  setupFilesAfterEnv: [path.resolve(__dirname, 'setup-react.ts')],

  globals: {
    'ts-jest': {
      tsconfig: path.resolve(__dirname, '../tsconfig-bases/lib-react-esm.json'),
    },
  },
};

export default config;
