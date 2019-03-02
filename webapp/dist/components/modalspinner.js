"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jquerymobile/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class ModalSpinner {
    constructor() {
        $(() => {
            $.mobile.loading();
            if ($('.ui-loader-background').is('*') === false) {
                // add the loader background
                $('body').append($('<div>').addClass('ui-loader-background').css({
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    padding: 0,
                    margin: 0,
                    background: "rgba(0, 0, 0, 0.3)",
                    display: 'none',
                    position: 'fixed',
                    'z-index': 10000
                }));
            }
        });
    }
    show(text) {
        return new Promise((resolve) => {
            $('.ui-loader-background').css('display', 'block');
            $.mobile.loading('show', {
                text: text || "",
                textVisible: !!text
            });
            resolve();
        });
    }
    hide() {
        $(() => {
            $('.ui-loader-background').css('display', 'none');
            $.mobile.loading('hide');
        });
    }
    static show(text) {
        if (!ModalSpinner.staticSpinner)
            ModalSpinner.staticSpinner = new ModalSpinner();
        return ModalSpinner.staticSpinner.show(text);
    }
    static hide() {
        if (!ModalSpinner.staticSpinner)
            ModalSpinner.staticSpinner = new ModalSpinner();
        ModalSpinner.staticSpinner.hide();
    }
}
exports.default = ModalSpinner;
