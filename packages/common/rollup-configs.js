import { execSync } from 'child_process';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import analyzer from 'rollup-plugin-analyzer';
import dts from 'rollup-plugin-dts';
import css from 'rollup-plugin-import-css';
import { replaceCode } from './rollup-plugins/replaceCode';
import { writeJSONFile } from './rollup-plugins/writeJSONFile';

// https://yarnpkg.com/advanced/lifecycle-scripts#environment-variables
const rootDir = process.env.PROJECT_CWD;

/**
 * @param {import('type-fest').PackageJson} pkg
 */
const getBuildMetadata = ({ name, version }) => {
  const now = new Date();

  return {
    packageName: name,
    packageVersion: version,
    buildDate: now.toLocaleString('en-US', { dateStyle: 'long' }),
    buildTime: now.toLocaleString('en-US', { timeStyle: 'long' }),
    gitCommit: execSync('git rev-parse HEAD').toString().trim(),
    gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
  };
};

/**
 * @param {import('type-fest').PackageJson} pkg
 * @param {Record<string, string>} buildMetadata
 */
const getBanner = ({ repository }, buildMetadata) => {
  const padLength = Object.keys(buildMetadata).reduce(
    (maxLength, key) => (key.length > maxLength ? key.length : maxLength),
    0,
  );

  const text = `
  OpenShift Dynamic Plugin SDK
  ${repository.url.replace(/\.git$/, '')}

  ${Object.entries(buildMetadata)
    .map(([key, value]) => `${key.padEnd(padLength)} : ${value}`)
    .join('\n  ')}
  `.trim();

  return `/**\n  ${text}\n */\n`;
};

/**
 * @param {import('type-fest').PackageJson} pkg
 */
const getExternalModules = ({ dependencies, peerDependencies }) => {
  const modules = new Set([
    ...Object.keys(dependencies ?? {}),
    ...Object.keys(peerDependencies ?? {}),
  ]);

  modules.add('lodash-es');
  modules.delete('lodash');

  return Array.from(modules);
};

/**
 * @param {import('type-fest').PackageJson} pkg
 */
const getExternalModuleRegExps = (pkg) => {
  const externalModules = getExternalModules(pkg);
  return externalModules.map((module) => new RegExp(`^${module}(\\/.+)*$`));
};

/**
 * @param {string} fileName
 */
const replaceLodashEsRequire = (fileName) =>
  replaceCode({
    fileName,
    replacements: {
      "require('lodash-es')": "require('lodash')",
    },
  });

/**
 * Rollup configuration for generating the library `.js` bundle.
 *
 * @param {import('type-fest').PackageJson} pkg
 * @param {string} inputFile
 * @param {'esm' | 'cjs'} format
 * @returns {import('rollup').RollupOptions}
 */
export const tsLibConfig = (pkg, inputFile, format = 'esm') => {
  const buildMetadata = getBuildMetadata(pkg);

  return {
    input: inputFile,
    output: {
      file: 'dist/index.js',
      format,
      banner: getBanner(pkg, buildMetadata),
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
        noEmitOnError: true,
      }),
      ...(format === 'cjs' ? [replaceLodashEsRequire('index.js')] : []),
      writeJSONFile({
        fileName: 'build-meta.json',
        value: buildMetadata,
      }),
      analyzer({
        summaryOnly: true,
        root: rootDir,
      }),
    ],
  };
};

/**
 * Rollup configuration for generating the library `.d.ts` bundle.
 *
 * @param {import('type-fest').PackageJson} pkg
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
  ],
});
