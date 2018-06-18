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
    show(text) {
        $(() => {
            $.mobile.loading('show', {
                text: text || "",
                textVisible: !!text
            });
        });
    }
    hide() {
        $(() => {
            $.mobile.loading('hide');
        });
    }
    static show(text) {
        if (!Spinner.staticSpinner)
            Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.show(text);
    }
    static hide() {
        if (!Spinner.staticSpinner)
            Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.hide();
    }
}
exports.default = Spinner;
