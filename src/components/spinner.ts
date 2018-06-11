/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jquerymobile/index.d.ts" />

export default class Spinner {
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

    private static staticSpinner: Spinner;

    static show() {
        if (!Spinner.staticSpinner) Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.show();
    }

    static hide() {
        if (!Spinner.staticSpinner) Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.hide();
    }
}