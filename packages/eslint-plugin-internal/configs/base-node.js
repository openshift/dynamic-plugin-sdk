const ecmaVersion =
  require('../../../tsconfig-bases/node-cjs.json').compilerOptions.target.substring(2);

module.exports = {
  extends: ['airbnb-base', 'plugin:promise/recommended', 'plugin:node/recommended'],

  parserOptions: {
    ecmaVersion,
    sourceType: 'module',
  },

  env: {
    [`es${ecmaVersion}`]: true,
    node: true,
  },

  plugins: ['promise', 'node'],

  rules: require('../rule-overrides/base-overrides'),
};
