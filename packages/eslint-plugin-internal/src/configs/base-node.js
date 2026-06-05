module.exports = {
  extends: ['airbnb-base', 'plugin:promise/recommended', 'plugin:n/recommended'],

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },

  env: {
    es2021: true,
    node: true,
  },

  settings: {
    ...require('./all-bases').settings,
  },

  plugins: ['promise', 'n', 'lodash'],

  rules: require('../rules/all-bases'),
};
