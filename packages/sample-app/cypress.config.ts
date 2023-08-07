import { defineConfig } from 'cypress';
import webpackConfig from './webpack.config';

export default defineConfig({
  screenshotsFolder: '../../screenshots',
  video: false,

  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig,
    },
    specPattern: 'src/components/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'src/cypress/component-index.html',
    supportFile: 'src/cypress/component-setup.tsx',
  },

  e2e: {
    baseUrl: 'http://localhost:9000/',
    specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
  },
});
