import nodeConfig from '@monorepo/common/jest/jest-config-node';
import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  ...nodeConfig,
  displayName: 'lib-webpack',
};

export default config;
