import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import AntdDayjsWebpackPlugin from 'antd-dayjs-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin'

const commonConfig = {
  entry: {
    app: [path.join(__dirname, '../app/assets/index.tsx')],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              configFile: path.join(__dirname, '../tsconfig.front.json'),
            },
          },
        ],
        include: path.join(__dirname, '../app/assets'),
      },
      {
        test: /\.less/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  'primary-color': '#4372FF',
                },
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|ttf)(\?t=\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: "[path][name].[ext]",
              esModule: false,
            }
          }
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NO_INTL: JSON.stringify(process.env.npm_config_nointl ? '1' : '0'),
      },
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '../app/assets/index.html'),
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
     new CopyPlugin({
      patterns: [
        {from: path.join(__dirname, '../app/assets/static/iconfont/iconfont.js')}
      ]
    }),
    new webpack.HashedModuleIdsPlugin(),
    new AntdDayjsWebpackPlugin()
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.woff', '.woff2', 'ttf'],
    alias: {
      '@assets': path.join(__dirname, '../app/assets/'),
      // fix this: https://github.com/react-component/table/issues/368
      'react-dom': '@hot-loader/react-dom'
    },
  },
};

if (process.env.npm_config_report) {
  commonConfig.plugins.push(new BundleAnalyzerPlugin());
}

export default commonConfig;
