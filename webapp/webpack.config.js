const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './dist/viewer.js',
    mode: 'development',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '..', 'public', 'dist')
    },
    plugins: [
        new UglifyJsPlugin()
    ]
}