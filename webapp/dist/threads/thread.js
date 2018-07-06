"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Thread(func, arg) {
    return new Promise((resolve, reject) => {
        let signature = func.toString();
        // let workerURL = URL.createObjectURL(new Blob([`
        // importScripts('/js/date.ext.js');
        // (function() { 
        //     var executor = ${signature}; 
        //     this.onmessage = function(e) { 
        //         var result = executor(e.data);
        //         postMessage(result);
        //     }
        // })()
        // `], { type: 'application/javascript' }));
        let workerURL = '/js/test.js';
        var worker = new Worker(workerURL);
        worker.onmessage = (ev) => {
            resolve(ev.data);
        };
        worker.postMessage(arg);
    });
}
exports.default = Thread;
