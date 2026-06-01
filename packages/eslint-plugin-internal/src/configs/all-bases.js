module.exports = {
  settings: {
    'import/internal-regex': /^@monorepo\//,
    // TODO: move back to typescript.js when typescript 5.x is upgraded
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'packages/*/tsconfig.json',
      },
    },
  },
};
