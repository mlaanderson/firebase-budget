"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("jquery");
require("jquerymobile");
class Spinner {
    constructor() {
        $(() => {
            $.mobile.loading();
        });
    }
    show() {
        $(() => {
            $.mobile.loading('show');
        });
    }
    hide() {
        $(() => {
            $.mobile.loading('hide');
        });
    }
    static show() {
        if (!Spinner.staticSpinner)
            Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.show();
    }
    static hide() {
        if (!Spinner.staticSpinner)
            Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.hide();
    }
}
exports.default = Spinner;
