import { execSync } from 'child_process';
/* eslint-disable import/no-extraneous-dependencies -- avoid pulling Rollup dependencies into common package.json */
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import analyzer from 'rollup-plugin-analyzer';
import dts from 'rollup-plugin-dts';
/* eslint-enable import/no-extraneous-dependencies */

// https://yarnpkg.com/advanced/lifecycle-scripts#environment-variables
const rootDir = process.env.PROJECT_CWD;

const getExternalModules = (pkg) => [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

const getExternalModuleTester = (pkg) => {
  const externalModules = getExternalModules(pkg);
  const externalModuleTests = externalModules.map((module) => new RegExp(`^${module}(\\/.+)*$`));
  return (moduleID) => externalModuleTests.some((regexp) => regexp.test(moduleID));
};

const getBanner = (pkg) => `/*
  OpenShift Dynamic Plugin SDK
  ${pkg.repository.url.replace(/\.git$/, '')}

  ${pkg.name} version ${pkg.version}
  ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'long' })}
  commit ${execSync('git rev-parse HEAD').toString().trim()}
*/\n`;

/**
 * @returns {import('rollup').RollupOptions}
 */
export const tsLibConfig = (pkg, inputFile) => ({
  input: inputFile,
  output: {
    file: 'dist/index.js',
    banner: getBanner(pkg),
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      include: ['src/**/*', '../common/src/**/*'],
    }),
    analyzer({
      summaryOnly: true,
      root: rootDir,
    }),
  ],
  external: getExternalModuleTester(pkg),
});

/**
 * @returns {import('rollup').RollupOptions}
 */
export const dtsLibConfig = (pkg, inputFile) => ({
  input: inputFile,
  output: {
    file: 'dist/index.d.ts',
  },
  plugins: [
    dts({
      respectExternal: true,
    }),
    analyzer({
      summaryOnly: true,
      root: rootDir,
    }),
  ],
  external: getExternalModuleTester(pkg),
});
