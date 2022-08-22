import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Generates `build-meta.json` file in the given directory.
 *
 * @param {object} options
 * @param {import("type-fest").PackageJson} options.pkg
 * @param {string} options.outputDir
 * @param {string} [options.cwd]
 * @returns {import('rollup').Plugin}
 */
export const writeBuildMetadata = ({ pkg, outputDir, cwd = process.cwd() }) => ({
  name: 'write-build-metadata',

  writeBundle() {
    const now = new Date();

    fs.writeJSONSync(
      path.resolve(cwd, outputDir, 'build-meta.json'),
      {
        name: pkg.name,
        version: pkg.version,
        buildDate: now.toLocaleString('en-US', { dateStyle: 'long' }),
        buildTime: now.toLocaleString('en-US', { timeStyle: 'long' }),
        gitCommit: execSync('git rev-parse HEAD').toString().trim(),
        gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      },
      {
        spaces: 2,
      },
    );
  },
});
