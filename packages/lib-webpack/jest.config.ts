import nodeConfig from '@monorepo/common/jest/jest-config-node';
import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  ...nodeConfig,
  displayName: 'lib-webpack',
};

export default config;
