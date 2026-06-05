import path from 'path';
import reactConfig from '@monorepo/common/jest/jest-config-react';
import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  ...reactConfig,
  displayName: 'sample-app',
  testPathIgnorePatterns: ['integration-tests'],
  transform: {
    '^.+\\.(jsx?|tsx?)$': [
      'ts-jest',
      {
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      },
    ],
  },
  moduleNameMapper: {
    ...reactConfig.moduleNameMapper,
    '^react$': path.resolve(__dirname, 'node_modules/react'),
    '^react-dom$': path.resolve(__dirname, 'node_modules/react-dom'),
  },
};

export default config;
