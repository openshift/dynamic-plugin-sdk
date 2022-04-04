import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import CSSMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HTMLPlugin from 'html-webpack-plugin';
import _ from 'lodash';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration, WebpackPluginInstance } from 'webpack';
import { EnvironmentPlugin, container } from 'webpack';
import { getSampleAppSharedModules } from './src/plugin-sdk-addons/shared-modules';

const isProd = process.env.NODE_ENV === 'production';

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

const sharedModules = getSampleAppSharedModules({
  eager: true,
  requiredVersion: false,
});

const getNodeModulesTest = (modulePaths: string[]) =>
  new RegExp(`/node_modules/(${modulePaths.map(_.escapeRegExp).join('|')})/`);

const plugins: WebpackPluginInstance[] = [
  new EnvironmentPlugin({
    NODE_ENV: 'development',
  }),
  new container.ModuleFederationPlugin({
    shared: sharedModules,
  }),
  new HTMLPlugin({
    filename: isProd ? '[name].[contenthash].html' : '[name].html',
    template: pathTo('src/app-index.html.ejs'),
    title: 'Minimal Plugin Host Application',
    chunks: ['app-minimal'],
  }),
  new CopyPlugin({
    patterns: [{ from: 'src/images/favicon.png', to: 'images' }],
  }),
];

const config: Configuration = {
  mode: isProd ? 'production' : 'development',
  entry: {
    'app-minimal': './src/app-minimal.tsx',
  },
  output: {
    path: pathTo('dist'),
    filename: isProd ? '[name].[contenthash].bundle.js' : '[name].bundle.js',
    chunkFilename: isProd ? 'chunks/[id].[chunkhash].min.js' : 'chunks/[id].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /\/node_modules\//,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: pathTo('tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.(svg|ttf|eot|otf|woff2?)$/,
        include: getNodeModulesTest([
          '@patternfly/react-core/dist/styles/assets/fonts',
          '@patternfly/react-core/dist/styles/assets/pficon',
        ]),
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 50 * 1024, // Files smaller than 50 kB will be inlined as data URLs
          },
        },
        generator: {
          filename: isProd ? 'fonts/[contenthash][ext]' : 'fonts/[name][ext]',
        },
      },
      {
        test: /\.(svg|png|jpg|jpeg|gif)$/,
        include: [
          pathTo('src'),
          getNodeModulesTest([
            '@patternfly/react-core/dist/styles/assets/images',
            '@patternfly/react-styles/css/assets/images',
          ]),
        ],
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 50 * 1024, // Files smaller than 50 kB will be inlined as data URLs
          },
        },
        generator: {
          filename: isProd ? 'images/[contenthash][ext]' : 'images/[name][ext]',
        },
      },
      {
        test: /\.(css)$/,
        include: [
          pathTo('src'),
          getNodeModulesTest([
            '@patternfly/react-core/dist/styles',
            '@patternfly/react-styles/css',
          ]),
        ],
        use: [isProd ? MiniCSSExtractPlugin.loader : 'style-loader', 'css-loader'],
      },
    ],
  },
  plugins,
  devtool: isProd ? 'source-map' : 'cheap-source-map',
  optimization: {
    minimize: isProd,
    minimizer: [
      '...', // The '...' string represents the webpack default TerserPlugin instance
      new CSSMinimizerPlugin(),
    ],
    splitChunks: {
      cacheGroups: {
        vendorReact: {
          test: getNodeModulesTest(['react', 'react-dom']),
          name: 'vendor-react',
          chunks: 'all',
        },
        vendorPatternFly: {
          test: getNodeModulesTest([
            '@patternfly/react-core',
            '@patternfly/react-icons',
            '@patternfly/react-styles',
            '@patternfly/react-table',
          ]),
          name: 'vendor-patternfly',
          chunks: 'all',
        },
      },
    },
  },
};

if (isProd) {
  plugins.push(
    new MiniCSSExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[chunkhash].css',
    }),
  );
}

export default config;
