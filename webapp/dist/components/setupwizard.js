"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
class SetupDialog extends dialog_1.default {
    constructor(addRecurring) {
        super('setupwizard');
        this.addRecurring = addRecurring;
    }
    afterRender() {
        super.afterRender();
        this.m_dialog.find('#btnSaveSetup').on('click', () => { console.log('you touched me'); });
    }
}
exports.default = SetupDialog;
