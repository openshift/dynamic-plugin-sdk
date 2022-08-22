import * as _ from 'lodash';

/**
 * Allows replacing code within the given file.
 *
 * @param {object} options
 * @param {string} options.file
 * @param {Record<string, string>} options.replacements
 * @returns {import('rollup').Plugin}
 */
export const replaceCode = ({ file, replacements }) => ({
  name: 'replace-code',

  renderChunk(code, chunk) {
    if (chunk.fileName !== file) {
      return null;
    }

    const newCode = Object.entries(replacements).reduce(
      (acc, [searchValue, replaceValue]) =>
        acc.replace(new RegExp(_.escapeRegExp(searchValue), 'g'), replaceValue),
      code,
    );

    return { code: newCode, map: chunk?.map };
  },
});
