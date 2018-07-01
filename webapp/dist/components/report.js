"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
class Report extends dialog_1.default {
    constructor(filename, data) {
        super(filename, data);
    }
    turnOffUpdates() { }
    turnOnUpdates() { }
}
exports.default = Report;
