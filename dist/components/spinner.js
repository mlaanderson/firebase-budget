"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jquerymobile/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
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
