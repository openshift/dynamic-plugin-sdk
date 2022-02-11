const config = {
  displayName: {
    name: 'common',
    color: 'white',
  },
  preset: 'ts-jest',
  moduleNameMapper: {
    'lodash-es': 'lodash',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'packages/common/tsconfig-bases/node-cjs.json',
    },
  },
};

export default config;
