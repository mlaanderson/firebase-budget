const path = require('path');

module.exports = {
    entry: './dist/viewer.js',
    mode: 'production',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public', 'dist')
    }
}