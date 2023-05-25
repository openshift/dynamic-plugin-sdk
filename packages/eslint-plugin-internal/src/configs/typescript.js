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
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: 'packages/*/tsconfig.json',
          },
        },
      },

      plugins: ['@typescript-eslint'],

      rules: require('../rules/typescript'),
    },
  ],
};
