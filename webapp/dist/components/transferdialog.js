"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
class TransferDialog extends dialog_1.default {
    constructor(total) {
        super('transfer', { total: total });
    }
}
exports.default = TransferDialog;
