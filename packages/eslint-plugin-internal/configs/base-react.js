const ecmaVersion =
  require('../../../tsconfig-bases/react-esm.json').compilerOptions.target.substring(2);

module.exports = {
  // airbnb config covers rules for plugins: import, react, react-hooks, jsx-a11y
  // airbnb rules for React hooks need to be enabled explicitly via airbnb/hooks
  extends: ['airbnb', 'airbnb/hooks', 'plugin:promise/recommended'],

  parserOptions: {
    ecmaVersion,
    ecmaFeatures: { jsx: true },
    sourceType: 'module',
  },

  env: {
    [`es${ecmaVersion}`]: true,
    browser: true,
  },

  plugins: ['promise'],
};
