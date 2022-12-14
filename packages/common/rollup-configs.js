import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import jsonc from 'jsonc-parser';
import analyzer from 'rollup-plugin-analyzer';
import css from 'rollup-plugin-import-css';
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
const getExternalModules = ({ dependencies, peerDependencies }) =>
  Array.from(new Set([...Object.keys(dependencies ?? {}), ...Object.keys(peerDependencies ?? {})]));

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
  const externalModules = getExternalModules(pkg);

  const tsconfig = jsonc.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'tsconfig.json'), 'utf-8'),
  );

  return {
    input: inputFile,
    output: {
      file: 'dist/index.js',
      format,
      banner: getBanner(pkg, buildMetadata),
    },
    external: externalModules.map((m) => new RegExp(`^${m}(\\/.+)*$`)),
    plugins: [
      nodeResolve(),
      commonjs(),
      css({
        output: 'dist/index.css',
      }),
      typescript({
        tsconfig: './tsconfig.json',
        include: tsconfig.include.map((filePattern) => `${filePattern}/**/*`),
        noEmitOnError: true,
        jsx: 'react',
      }),
      writeJSONFile({
        fileName: 'build-metadata.json',
        value: buildMetadata,
      }),
      analyzer({
        summaryOnly: true,
        root: rootDir,
      }),
    ],
  };
};
