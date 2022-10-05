import { tsLibConfig, dtsLibConfig } from '../common/rollup-configs';
import pkg from './package.json';

export default [
  tsLibConfig(pkg, 'src/index.ts'),
  dtsLibConfig(pkg, 'dist/types/lib-extensions/src/index.d.ts'),
];
