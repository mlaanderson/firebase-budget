/// <reference path="../../node_modules/@types/jquery/index.d.ts" />


export default class Button {
    protected element : JQuery<HTMLElement>;
    private m_disabled: boolean;

    constructor(button: string | HTMLElement | JQuery<HTMLElement>) {
        $(() => {
            this.element = $(button);
        });
        this.m_disabled = false;
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

    get disabled() : boolean {
        return this.m_disabled;
    }

    set disabled(value: boolean) {
        this.m_disabled = value;
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.disabled = value;
                }, 100);
                return;
            }
            if (value) {
                this.element.addClass('ui-disabled');
            } else {
                this.element.removeClass('ui-disabled');
            }
        });
    }

    get visible() : boolean {
        return this.element.css('display') !== 'none';
    }
}