const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'content-scripts/form-detector': './src/content-scripts/form-detector.ts',
    'content-scripts/form-filler': './src/content-scripts/form-filler.ts',
    'content-scripts/job-board-detector': './src/content-scripts/job-board-detector.ts',
    'popup/popup': './src/popup/popup.ts',
    'options/options': './src/options/options.ts',
    'services/api': './src/services/api.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'src/options/options.html', to: 'options/options.html' },
        { from: 'src/options/options.css', to: 'options/options.css' },
        { from: 'src/content-scripts/styles.css', to: 'content-scripts/styles.css' },
        { from: 'src/assets', to: 'assets' }
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        api: {
          test: /[\\/]services[\\/]/,
          name: 'api-service',
          chunks: 'all',
        },
      },
    },
  },
};
