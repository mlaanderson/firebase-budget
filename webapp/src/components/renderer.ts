/// <reference path="../ejs.d.ts" />

import Events from "../controllers/events";

export default class Renderer extends Events {
    render(filename: string, data?: Object) : Promise<string> {
        return new Promise((resolve, reject) => {
            data = data || {};
            ejs.renderFile(filename, data, (template) => {
                resolve(template);
            });
        });
    }
}