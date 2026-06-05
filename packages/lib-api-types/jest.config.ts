import nodeConfig from '@monorepo/common/jest/jest-config-node';
import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  ...nodeConfig,
  displayName: 'lib-api-types',
};

export default config;
