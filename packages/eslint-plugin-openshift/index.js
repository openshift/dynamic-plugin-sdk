const componentConfigs = {
  // Base configs: choose one
  'base-node': require('./configs/base-node'),
  'base-react': require('./configs/base-react'),

  // TypeScript support (optional)
  typescript: require('./configs/typescript'),

  // Prettier must go last (optional)
  prettier: require('./configs/prettier'),
};

const presetConfigs = {
  'node-typescript-prettier': {
    extends: [
      'plugin:openshift/base-node',
      'plugin:openshift/typescript',
      'plugin:openshift/prettier',
    ],
  },

  'react-typescript-prettier': {
    extends: [
      'plugin:openshift/base-react',
      'plugin:openshift/typescript',
      'plugin:openshift/prettier',
    ],
  },
};

module.exports = {
  configs: { ...componentConfigs, ...presetConfigs },
};
