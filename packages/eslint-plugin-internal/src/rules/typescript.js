module.exports = {
  // Disallow the use of variables before they are defined
  'no-use-before-define': 'off',
  '@typescript-eslint/no-use-before-define': 'error',

  // Disallow variable declarations from shadowing variables declared in the outer scope
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': 'error',

  // Enforce default parameters to be last
  'default-param-last': 'off',
  '@typescript-eslint/default-param-last': 'error',

  // Enforces consistent usage of type imports
  '@typescript-eslint/consistent-type-imports': 'error',

  // Restrict file extensions that may contain JSX
  'react/jsx-filename-extension': [
    'error',
    {
      allow: 'as-needed',
      extensions: ['.tsx'],
    },
  ],
};
