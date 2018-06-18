const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './dist/app.js',
    mode: 'production',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public', 'dist')
    },
    plugins: [
        //new webpack.IgnorePlugin(/^firebase/) // let firebase load from google
    ]
}