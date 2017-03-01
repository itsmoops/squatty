const webpack = require('webpack')
const path = require('path')

module.exports = {
    entry: "./src/app.js",
    target: 'web',
    output: {
      path: path.join(__dirname, '/src/dist/'),
      filename: '[name].bundle.js',
      publicPath: '/dist/'
    },
    devServer: {
      historyApiFallback: true,
      watchOptions: { aggregateTimeout: 300, poll: 1000 }
    },
    debug: true,
    devtool: 'source-map',
    module: {
        loaders: [
            {
              loader: 'babel',
              exclude: /node_modules/,
              query: {
                cacheDirectory: true,
                presets: ['es2015']
              }
            },
            {
                test: /\.css$/,
                loader: "style!css"
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        })
    ]
};
