const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './dist/viewer.js',
    mode: 'production',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public', 'dist')
    },
    plugins: [
        new webpack.IgnorePlugin(/^firebase/), // let firebase load from google
        new UglifyJsPlugin()
    ]
}