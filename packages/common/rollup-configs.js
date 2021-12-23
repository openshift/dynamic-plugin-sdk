import { execSync } from 'child_process';
/* eslint-disable import/no-extraneous-dependencies */
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import analyzer from 'rollup-plugin-analyzer';
import dts from 'rollup-plugin-dts';
/* eslint-enable import/no-extraneous-dependencies */

const getExternalModules = (pkg) => [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

const getExternalModuleTester = (pkg) => {
  const externalModules = getExternalModules(pkg);
  const externalModuleTests = externalModules.map((module) => new RegExp(`^${module}(\\/.+)*$`));
  return (source) => externalModuleTests.some((regexp) => regexp.test(source));
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
export const tsLibConfig = (pkg) => ({
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    banner: getBanner(pkg),
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    analyzer({
      summaryOnly: true,
    }),
  ],
  external: getExternalModuleTester(pkg),
});

/**
 * @returns {import('rollup').RollupOptions}
 */
export const dtsLibConfig = (pkg) => ({
  input: 'dist/types/index.d.ts',
  output: {
    file: 'dist/index.d.ts',
    format: 'esm',
  },
  plugins: [
    dts({
      respectExternal: true,
    }),
    analyzer({
      summaryOnly: true,
    }),
  ],
  external: getExternalModuleTester(pkg),
});
