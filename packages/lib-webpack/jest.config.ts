import nodeConfig from '@monorepo/common/test-configs/jest-config-node';
import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  ...nodeConfig,
  displayName: 'lib-webpack',
};

export default config;
