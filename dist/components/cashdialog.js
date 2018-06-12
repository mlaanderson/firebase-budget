"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
class CashDialog extends dialog_1.default {
    constructor(data) {
        super('cash', { cash: data, total: data.getTotal() });
    }
}
exports.default = CashDialog;
