import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  projects: [
    '<rootDir>/packages/common',
    '<rootDir>/packages/lib-core',
    '<rootDir>/packages/lib-utils',
    '<rootDir>/packages/lib-webpack',
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/(node_modules|dist)/**',
    '!**/*.{test,stories}.*',
  ],

  // https://github.com/kulshekhar/ts-jest/issues/259#issuecomment-888978737
  maxWorkers: 1,
  logHeapUsage: !!process.env.CI,
};

export default config;
