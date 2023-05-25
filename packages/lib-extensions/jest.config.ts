import reactConfig from '@monorepo/common/jest/jest-config-react';
import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  ...reactConfig,
  displayName: 'lib-extensions',
};

export default config;
