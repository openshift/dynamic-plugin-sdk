module.exports = {
  root: true,
  extends: ['plugin:@monorepo/eslint-plugin-internal/react-typescript-prettier'],
  overrides: [
    {
      files: ['*.cy.ts', '*.cy.tsx'],
      rules: {
        // Suppress false positives due to https://docs.cypress.io/api/commands/then
        'promise/always-return': 'off',
        'promise/catch-or-return': 'off',
      },
    },
  ],
};
