import path from 'path';
import type { JestConfigWithTsJest } from 'ts-jest';
import baseConfig from './jest-config-base';

const config: JestConfigWithTsJest = {
  ...baseConfig,
  testEnvironment: 'node',

  transform: {
    '^.+\\.(jsx?|tsx?)$': [
      'ts-jest',
      {
        tsconfig: path.resolve(__dirname, '../tsconfig-bases/lib-node-cjs.json'),
      },
    ],
  },
};

export default config;
