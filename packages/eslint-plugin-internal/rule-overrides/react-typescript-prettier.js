module.exports = {
  // Ensure consistent use of file extension within the import path
  'import/extensions': 'off',

  // Enforce a specific function type for function components
  'react/function-component-definition': [
    'error',
    {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function',
    },
  ],
};
