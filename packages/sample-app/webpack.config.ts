import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import CSSMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HTMLPlugin from 'html-webpack-plugin';
import { escapeRegExp } from 'lodash';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration, WebpackPluginInstance } from 'webpack';
import { EnvironmentPlugin, container } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { appSharedModules } from './src/shared-modules';

const isProd = process.env.NODE_ENV === 'production';
const analyzeBundles = process.env.ANALYZE_BUNDLES === 'true';

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

export const getNodeModulesTest = (modulePaths: string[]) =>
  new RegExp(`/node_modules/(${modulePaths.map(escapeRegExp).join('|')})/`);

const plugins: WebpackPluginInstance[] = [
  new EnvironmentPlugin({
    NODE_ENV: 'development',
  }),
  new container.ModuleFederationPlugin({
    shared: appSharedModules,
  }),
  new HTMLPlugin({
    template: pathTo('src/app-index.html.ejs'),
    title: 'Sample Plugin Host Application',
    chunks: ['app'],
  }),
  new CopyPlugin({
    patterns: [{ from: 'src/images/favicon.png', to: 'images' }],
  }),
];

const config: Configuration = {
  mode: isProd ? 'production' : 'development',
  entry: {
    app: './src/app.tsx',
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
          getNodeModulesTest([
            '@patternfly/react-core/dist/styles/assets/images',
            '@patternfly/react-styles/css/assets/images',
          ]),
          pathTo('src'),
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
          getNodeModulesTest([
            '@patternfly/react-core/dist/styles',
            '@patternfly/react-styles/css',
          ]),
          pathTo('src'),
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
            '@patternfly/react-tokens',
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

if (analyzeBundles) {
  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: pathTo('dist/bundle-report.html'),
      openAnalyzer: false,
    }),
  );
}

export default config;
