"use strict";

var program = require("commander");
var fs = require("fs");
var pkg = require("./package.json");

function build(...files) {
    for (let file of files) {
        let data = require(`./${file}.js`);
        fs.writeFile(`./${file}.json`, JSON.stringify(data, null, 4), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}

program.version(pkg.version);
program.action((command) => {
    switch(command) {
        case 'intro':
            build('intro');
            break;
        case 'all':
            build('intro');
            break;
    }
})
program.parse(process.argv);

