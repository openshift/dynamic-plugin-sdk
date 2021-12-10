const componentConfigs = {
  // Base configs: choose one
  'base-node': require('./configs/base-node'),
  'base-react': require('./configs/base-react'),

  // TypeScript support (optional)
  typescript: require('./configs/typescript'),

  // Prettier must go last (optional)
  prettier: require('./configs/prettier'),
};

const commonPresetConfig = {
  // Report unused eslint-disable comments as warnings
  reportUnusedDisableDirectives: true,
};

const presetConfigs = {
  'node-typescript-prettier': {
    ...commonPresetConfig,
    extends: [
      'plugin:@monorepo/eslint-plugin-internal/base-node',
      'plugin:@monorepo/eslint-plugin-internal/typescript',
      'plugin:@monorepo/eslint-plugin-internal/prettier',
    ],
    rules: require('./rules/node-typescript-prettier'),
  },

  'react-typescript-prettier': {
    ...commonPresetConfig,
    extends: [
      'plugin:@monorepo/eslint-plugin-internal/base-react',
      'plugin:@monorepo/eslint-plugin-internal/typescript',
      'plugin:@monorepo/eslint-plugin-internal/prettier',
    ],
    rules: require('./rules/react-typescript-prettier'),
  },
};

module.exports = {
  configs: { ...componentConfigs, ...presetConfigs },
};
