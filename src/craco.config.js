const BundleAnalyzerPlugin = require('craco-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Оптимизация split chunks
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: 'react-vendor',
            priority: 20,
            chunks: 'all',
          },
          ui: {
            test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
            name: 'ui-vendor',
            priority: 15,
            chunks: 'all',
          },
        },
      };
      
      return webpackConfig;
    },
    plugins: [
      {
        plugin: BundleAnalyzerPlugin,
        options: {
          analyzerMode: 'static',
          openAnalyzer: false,
        },
      },
    ],
  },
  devServer: {
    client: {
      overlay: false,
    },
  },
};