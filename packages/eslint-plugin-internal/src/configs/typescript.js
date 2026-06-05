module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.tsx'],

      extends: ['plugin:@typescript-eslint/recommended'],

      parser: '@typescript-eslint/parser',

      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
      },

      plugins: ['@typescript-eslint'],

      rules: require('../rules/typescript'),
    },
  ],
};
