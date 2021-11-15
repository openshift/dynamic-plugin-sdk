module.exports = {
    'import/extensions': ['error', {'ts': 'never'}],
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    "@typescript-eslint/ban-types": [
        "error",
        {
          "extendDefaults": true,
          "types": {
            "{}": false
          }
        }
      ]
}