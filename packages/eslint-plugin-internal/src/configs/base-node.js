module.exports = {
  extends: ['airbnb-base', 'plugin:promise/recommended', 'plugin:node/recommended'],

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

  plugins: ['promise', 'node'],

  rules: require('../rules/all-bases'),
};
