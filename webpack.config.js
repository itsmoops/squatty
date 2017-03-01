const webpack = require('webpack');

module.exports = {
    entry: "./js/app.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    devServer: {
      historyApiFallback: true,
      watchOptions: { aggregateTimeout: 300, poll: 1000 }
    },
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
