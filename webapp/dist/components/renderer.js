"use strict";
/// <reference path="../ejs.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class Renderer {
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
