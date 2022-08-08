import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Removes the specified files or directories.
 *
 * @param {object} options
 * @param {string[]} options.files
 * @param {string} [options.cwd]
 * @param {string} [options.hook]
 * @returns {import('rollup').Plugin}
 */
export const removeFiles = ({ files, cwd = process.cwd(), hook = 'generateBundle' }) => ({
  name: 'remove-files',

  [hook]: () => {
    files.forEach((f) => {
      fs.removeSync(path.resolve(cwd, f));
    });
  },
});
