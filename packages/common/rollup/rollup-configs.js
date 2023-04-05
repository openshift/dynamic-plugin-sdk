import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import jsonc from 'jsonc-parser';
import analyzer from 'rollup-plugin-analyzer';
import css from 'rollup-plugin-import-css';
import { writeJSONFile } from './plugins/writeJSONFile';

// https://yarnpkg.com/advanced/lifecycle-scripts#environment-variables
const rootDir = process.env.PROJECT_CWD;

/**
 * @param {import('type-fest').PackageJson} pkg
 * @returns {Record<string, string>}
 */
const getBuildMetadata = ({ name, version }, buildDate = new Date()) => ({
  packageName: name,
  packageVersion: version,
  buildDate: buildDate.toLocaleString('en-US', { dateStyle: 'long' }),
  buildTime: buildDate.toLocaleString('en-US', { timeStyle: 'long' }),
  gitCommit: execSync('git rev-parse HEAD').toString().trim(),
  gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
});

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
const getExternalModules = ({ dependencies, peerDependencies }) =>
  Array.from(new Set([...Object.keys(dependencies ?? {}), ...Object.keys(peerDependencies ?? {})]));

/**
 * Rollup build configuration for TypeScript to JavaScript compilation.
 *
 * @param {object} options
 * @param {import('type-fest').PackageJson} options.pkg
 * @param {string} options.inputFile
 * @param {string} options.outputDir
 * @param {string} options.cssOutputFile
 * @param {'cjs' | 'cjs-and-esm'} options.format
 * @returns {import('rollup').RollupOptions[]}
 */
export const tsBuildConfig = ({
  pkg,
  inputFile = 'src/index.ts',
  outputDir = 'dist',
  cssOutputFile = 'index.css',
  format,
}) => {
  const buildMetadata = getBuildMetadata(pkg);
  const banner = getBanner(pkg, buildMetadata);

  const externalModules = getExternalModules(pkg);
  const external = externalModules.map((m) => new RegExp(`^${m}(\\/.+)*$`));

  const tsconfig = jsonc.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'tsconfig.json'), 'utf-8'),
  );

  /** @param {boolean} esmFormat */
  const getBuildPlugins = (esmFormat) => [
    nodeResolve(),
    commonjs(),
    json({
      compact: true,
      preferConst: true,
    }),
    css({
      output: cssOutputFile,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      include: tsconfig.include.map((filePattern) => `${filePattern}/**/*`),
      noEmitOnError: true,
      jsx: 'react',
    }),
    optimizeLodashImports({
      appendDotJs: false,
      useLodashEs: esmFormat,
    }),
    analyzer({
      root: rootDir,
      summaryOnly: true,
    }),
  ];

  /** @type {import('rollup').RollupOptions} */
  const cjsBuildConfig = {
    input: inputFile,
    output: {
      file: path.resolve(outputDir, 'index.cjs.js'),
      format: 'cjs',
      banner,
    },
    external,
    plugins: getBuildPlugins(false),
  };

  /** @type {import('rollup').RollupOptions} */
  const esmBuildConfig = {
    input: inputFile,
    output: {
      file: path.resolve(outputDir, 'index.esm.js'),
      format: 'esm',
      banner,
    },
    external,
    plugins: getBuildPlugins(true),
  };

  const configs = [];

  switch (format) {
    case 'cjs-and-esm':
      configs.push(cjsBuildConfig, esmBuildConfig);
      break;
    case 'cjs':
      configs.push(cjsBuildConfig);
      break;
    default:
      throw new Error('Unsupported format parameter');
  }

  configs[0].plugins.push(
    writeJSONFile({
      fileName: 'build-metadata.json',
      value: buildMetadata,
    }),
  );

  return configs;
};
