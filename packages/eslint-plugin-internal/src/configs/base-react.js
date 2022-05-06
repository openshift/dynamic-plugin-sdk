module.exports = {
  // airbnb config covers rules for plugins: import, react, react-hooks, jsx-a11y
  // airbnb rules for React hooks need to be enabled explicitly via airbnb/hooks
  extends: ['airbnb', 'airbnb/hooks', 'plugin:promise/recommended'],

  parserOptions: {
    ecmaVersion: 2021,
    ecmaFeatures: { jsx: true },
    sourceType: 'module',
  },

  env: {
    es2021: true,
    browser: true,
  },

  settings: {
    ...require('./all-bases').settings,
  },

  plugins: ['promise'],

  rules: require('../rules/all-bases'),
};
