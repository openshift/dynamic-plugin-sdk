import reactConfig from '@monorepo/common/test-configs/jest-config-react';
import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  ...reactConfig,
  displayName: 'lib-utils',
};

export default config;
