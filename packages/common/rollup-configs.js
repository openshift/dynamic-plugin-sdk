import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import analyzer from 'rollup-plugin-analyzer';
import dts from 'rollup-plugin-dts';
import css from 'rollup-plugin-import-css';
import { removeFiles } from './rollup-plugins/removeFiles';
import { replaceCode } from './rollup-plugins/replaceCode';
import { writeBuildMetadata } from './rollup-plugins/writeBuildMetadata';

/** @typedef {import("type-fest").PackageJson} PackageJson */

// https://yarnpkg.com/advanced/lifecycle-scripts#environment-variables
const rootDir = process.env.PROJECT_CWD;

/**
 * @param {PackageJson} pkg
 */
const getExternalModules = (pkg) => [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...('lodash' in pkg.dependencies ? ['lodash-es'] : []),
];

/**
 * @param {PackageJson} pkg
 */
const getExternalModuleRegExps = (pkg) => {
  const externalModules = getExternalModules(pkg);
  return externalModules.map((module) => new RegExp(`^${module}(\\/.+)*$`));
};

/**
 * @param {string} file
 */
const replaceLodashEsRequire = (file) =>
  replaceCode({
    file,
    replacements: {
      "require('lodash-es')": "require('lodash')",
    },
  });

/**
 * Rollup configuration for generating the library `.js` bundle.
 *
 * @param {PackageJson} pkg
 * @param {string} inputFile
 * @param {'esm' | 'cjs'} format
 * @returns {import('rollup').RollupOptions}
 */
export const tsLibConfig = (pkg, inputFile, format = 'esm') => ({
  input: inputFile,
  output: {
    file: 'dist/index.js',
    format,
  },
  external: getExternalModuleRegExps(pkg),
  plugins: [
    nodeResolve(),
    commonjs(),
    css({
      output: 'dist/index.css',
    }),
    typescript({
      tsconfig: './tsconfig.json',
      include: ['src/**/*', '../common/src/**/*'],
    }),
    ...(format === 'cjs' ? [replaceLodashEsRequire('index.js')] : []),
    analyzer({
      summaryOnly: true,
      root: rootDir,
    }),
    writeBuildMetadata({
      pkg,
      outputDir: 'dist',
    }),
  ],
});

/**
 * Rollup configuration for generating the library `.d.ts` bundle.
 *
 * @param {PackageJson} pkg
 * @param {string} inputFile
 * @returns {import('rollup').RollupOptions}
 */
export const dtsLibConfig = (pkg, inputFile) => ({
  input: inputFile,
  output: {
    file: 'dist/index.d.ts',
  },
  external: [...getExternalModuleRegExps(pkg), /\.css$/],
  plugins: [
    dts({
      respectExternal: true,
    }),
    analyzer({
      summaryOnly: true,
      root: rootDir,
    }),
    removeFiles({
      files: ['dist/types'],
    }),
  ],
});
