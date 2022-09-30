import type { InitialOptionsTsJest } from 'ts-jest';

process.env.TZ = 'UTC';

const config: InitialOptionsTsJest = {
  projects: [
    '<rootDir>/packages/common',
    '<rootDir>/packages/lib-core',
    '<rootDir>/packages/lib-utils',
    '<rootDir>/packages/lib-webpack',
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!**/(node_modules|dist)/**'],
};

export default config;
