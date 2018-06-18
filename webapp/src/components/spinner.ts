/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jquerymobile/index.d.ts" />

export default class Spinner {
    constructor() {
        $(() => {
            $.mobile.loading();
        });
    }

    show(text?: string) {
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

    private static staticSpinner: Spinner;

    static show(text?: string) {
        if (!Spinner.staticSpinner) Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.show(text);
    }

    static hide() {
        if (!Spinner.staticSpinner) Spinner.staticSpinner = new Spinner();
        Spinner.staticSpinner.hide();
    }
}