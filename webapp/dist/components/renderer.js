"use strict";
/// <reference path="../ejs.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../controllers/events");
class Renderer extends events_1.default {
    render(filename, data) {
        return new Promise((resolve, reject) => {
            data = data || {};
            ejs.renderFile(filename, data, (template) => {
                resolve(template);
            });
        });
    }
}
exports.default = Renderer;
