import { execSync } from 'child_process';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import analyzer from 'rollup-plugin-analyzer';
import dts from 'rollup-plugin-dts';
import css from 'rollup-plugin-import-css';

// https://yarnpkg.com/advanced/lifecycle-scripts#environment-variables
const rootDir = process.env.PROJECT_CWD;

const getExternalModules = (pkg) => [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...('lodash' in pkg.dependencies ? ['lodash-es'] : []),
];

const getExternalModuleRegExps = (pkg) => {
  const externalModules = getExternalModules(pkg);
  return externalModules.map((module) => new RegExp(`^${module}(\\/.+)*$`));
};

const getBanner = (pkg) => {
  const text = `
  OpenShift Dynamic Plugin SDK
  ${pkg.repository.url.replace(/\.git$/, '')}

  ${pkg.name} version ${pkg.version}
  build date ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'long' })}
  git commit ${execSync('git rev-parse HEAD').toString().trim()}
  `.trim();

  return `/*\n  ${text}\n */\n`;
};

/**
 * @returns {import('rollup').Plugin}
 */
const replaceLodashEsRequire = () => ({
  name: 'replace-lodash-es-require',

  renderChunk(code, chunk) {
    return {
      code: code.replace("require('lodash-es')", "require('lodash')"),
      map: chunk?.map,
    };
  },
});

/**
 * Rollup configuration for generating the library `.js` bundle.
 *
 * @param {string} inputFile
 * @param {'esm' | 'cjs'} format
 * @returns {import('rollup').RollupOptions}
 */
export const tsLibConfig = (pkg, inputFile, format = 'esm') => ({
  input: inputFile,
  output: {
    file: 'dist/index.js',
    format,
    banner: getBanner(pkg),
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
    ...(format === 'cjs' ? [replaceLodashEsRequire()] : []),
    analyzer({
      summaryOnly: true,
      root: rootDir,
    }),
  ],
});

/**
 * Rollup configuration for generating the library `.d.ts` bundle.
 *
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
