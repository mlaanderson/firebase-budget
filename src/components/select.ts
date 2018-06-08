import * as $ from "jquery";


export default class Select {
    protected element : JQuery<HTMLElement>;

    constructor(button: string | HTMLElement | JQuery<HTMLElement>) {
        $(() => {
            this.element = $(button);
        });
    }

    on(events: string, handler: (e: JQueryEventObject) => void) : Select {
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

    off(events: string, handler: false | JQuery.EventHandlerBase<any, JQuery.Event<HTMLElement, any>>) : Select {
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

    val(value?: string) : string | Select {
        if (value) {
            $(() => {
                this.element.val(value);
            });

            return this;
        } else {
            return this.element ? this.element.val().toString() : null;
        }
    }

}