const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',  // 开发阶段使用 development 模式便于调试
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' }
      ],
    }),
  ],
  resolve: {
    fallback: {
      fs: false,
      path: false,
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
  },
};