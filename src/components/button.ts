/// <reference path="../../node_modules/@types/jquery/index.d.ts" />


export default class Button {
    protected element : JQuery<HTMLElement>;

    constructor(button: string | HTMLElement | JQuery<HTMLElement>) {
        $(() => {
            this.element = $(button);
        });
    }

    on(events: string, handler: (e: JQueryEventObject) => void) : Button {
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.on(events, handler);
                }, 100);
                return;
            }
            this.element.on(events, null, null, handler);
        });

        return this;
    }

    off(events: string, handler: false | JQuery.EventHandlerBase<any, JQuery.Event<HTMLElement, any>>) : Button {
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.off(events, handler);
                }, 100);
                return;
            }
            this.element.off(events, null, handler);
        });
        return this;
    }

    click() : Button {
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.click();
                }, 100);
                return;
            }
            this.element.click();
        });
        return this;
    }
}