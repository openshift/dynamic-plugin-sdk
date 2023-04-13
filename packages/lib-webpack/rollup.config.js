import { tsBuildConfig } from '../common/rollup/rollup-configs';
import pkg from './package.json';

export default tsBuildConfig({ pkg, format: 'cjs' });
