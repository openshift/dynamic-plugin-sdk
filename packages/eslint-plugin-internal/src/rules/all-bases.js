module.exports = {
  // Enforce a convention in the order of require() / import statements
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
      'newlines-between': 'never',
      warnOnUnassignedImports: true,
    },
  ],

  // When there is only a single export from a module, prefer using default export over named export
  'import/prefer-default-export': 'off',

  // Enforce a maximum number of classes per file
  'max-classes-per-file': 'off',

  // Forbid the use of extraneous packages
  'import/no-extraneous-dependencies': [
    'error',
    {
      devDependencies: true,
    },
  ],
};
