const path = require('path');

module.exports = {
    entry: './dist/app.js',
    mode: 'production',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public', 'dist')
    }
}