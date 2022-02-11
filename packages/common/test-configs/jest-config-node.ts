import path from 'path';
import type { InitialOptionsTsJest } from 'ts-jest';
import baseConfig from './jest-config-base';

const config: InitialOptionsTsJest = {
  ...baseConfig,
  testEnvironment: 'node',

  globals: {
    'ts-jest': {
      tsconfig: path.resolve(__dirname, '../tsconfig-bases/lib-node-cjs.json'),
    },
  },
};

export default config;
