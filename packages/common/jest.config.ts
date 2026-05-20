import reactConfig from '@monorepo/common/jest/jest-config-react';
import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  ...reactConfig,
  displayName: 'common',
};

export default config;
