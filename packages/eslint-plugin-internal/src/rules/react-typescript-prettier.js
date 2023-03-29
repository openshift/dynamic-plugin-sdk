module.exports = {
  // Ensure consistent use of file extension within the import path
  'import/extensions': 'off',

  // Disallow unnecessary fragments
  'react/jsx-no-useless-fragment': [
    'error',
    {
      allowExpressions: true,
    },
  ],

  // Enforce a specific function type for function components
  'react/function-component-definition': [
    'error',
    {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function',
    },
  ],

  // Enforce a defaultProps definition for every prop that is not a required prop
  'react/require-default-props': 'off',

  // Enforce that block statements are wrapped in curly braces
  curly: ['error', 'all'],
};
