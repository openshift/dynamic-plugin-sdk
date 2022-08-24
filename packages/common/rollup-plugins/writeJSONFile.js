/**
 * Emits a JSON file to the build output.
 *
 * @param {object} options
 * @param {string} options.fileName
 * @param {import('type-fest').JsonValue} options.value
 * @returns {import('rollup').Plugin}
 */
export const writeJSONFile = ({ fileName, value }) => ({
  name: 'write-json-file',

  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName,
      source: JSON.stringify(value, null, 2),
    });
  },
});
