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
};

if (process.env.CI) {
  // https://github.com/kulshekhar/ts-jest/issues/259#issuecomment-888978737
  config.maxWorkers = 1;
}

export default config;
