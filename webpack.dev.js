const path = require('path');
const webpack = require('webpack')
// const CopyPlugin = require('copy-webpack-plugin');
const { ESBuildPlugin } = require('esbuild-loader')
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  entry: path.resolve(__dirname, './dev/dev.ts'),
  devtool: 'source-map',
  cache: {
    type: 'filesystem',
  },
  optimization: {
    // runtimeChunk: 'single'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        use: ['file-loader?name=src/fonts/[name].[ext]'],
      },
    ],
  },
  plugins: [
    new ESBuildPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false }),
    new HtmlWebpackPlugin({
      title: 'Measurements View',
      filename: 'index.html',
      template: './index.html',
    }),
    new webpack.DefinePlugin({
      DEBUG: true,
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        DEBUG: JSON.stringify(true)
      }
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.[hash:8].js',
    path: path.resolve(__dirname, './dist'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    compress: true,
    port: 9000,
    hot: true,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};

