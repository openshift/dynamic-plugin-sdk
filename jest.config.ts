import type { Config } from '@jest/types';

process.env.TZ = 'UTC';

const config: Config.InitialOptions = {
  verbose: true,
  coverageDirectory: 'coverage',
  collectCoverage: true,
  transformIgnorePatterns: [
    'node_modules/(?!@patternfly|lodash-es|@popperjs|i18next)'
  ],
  clearMocks: true,
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'text-summary'
  ],
  collectCoverageFrom: [
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.test.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
  ],
  testURL: 'http://localhost',
  testRegex: '.*\\.(spec|test)\\.(ts|tsx|js|jsx)$',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  roots: ['<rootDir>'],
  projects: [
    '<rootDir>/packages/common',
    '<rootDir>/packages/lib-core',
    '<rootDir>/packages/lib-utils',
  ],
  setupFilesAfterEnv: ['<rootDir>/config/setupTests.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/packages/common/tsconfig-bases/react-esm.json',
    },
  },
};

export default config;
