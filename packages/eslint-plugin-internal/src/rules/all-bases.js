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
    },
  ],

  // When there is only a single export from a module, prefer using default export over named export
  'import/prefer-default-export': 'off',

  // Enforce a maximum number of classes per file
  'max-classes-per-file': 'off',

  // Replaced by lib-restricted-external-imports, see the replacement rule documentation for details
  'import/no-extraneous-dependencies': 'off',

  // Enforce imported external modules to be declared in dependencies or peerDependencies within the closest parent package.json
  'lib-restricted-external-imports': [
    'error',
    [
      {
        includeFiles: 'packages/+(lib-core|lib-webpack)/src/**',
        excludeFiles: '**/*.test.*',
        excludeModules: ['@monorepo/common'],
      },
      {
        includeFiles: 'packages/+(lib-extensions|lib-utils)/src/**',
        excludeFiles: '**/*.+(test|stories).*',
      },
    ],
  ],
};
