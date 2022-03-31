import { tsLibConfig, dtsLibConfig } from '../common/rollup-configs';
import pkg from './package.json';

export default [
  tsLibConfig(pkg, 'src/index.ts', 'cjs'),
  dtsLibConfig(pkg, 'dist/types/lib-webpack/src/index.d.ts'),
];
