import type { StorybookConfig } from '@storybook/core-common';

const config: StorybookConfig = {
  stories: [
    {
      directory: '../packages/lib-utils',
      titlePrefix: 'SDK utility components',
      files: 'src/**/*.stories.*',
    },
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-react-router-v6',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
};

export default config;
