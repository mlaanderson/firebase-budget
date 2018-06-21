/// <reference path="../../node_modules/@types/jquery/index.d.ts" />


export default class Select {
    protected element : JQuery<HTMLElement>;

    constructor(select: string | HTMLElement | JQuery<HTMLElement>) {
        $(() => {
            this.element = $(select);
            this.element.selectmenu();
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

    append(elementOrValue: JQuery<HTMLElement> | HTMLElement | string, text?: string, selected?: boolean) {
        let option: JQuery<HTMLElement>;
        if (typeof elementOrValue === "string") {
            // construct the element with the passed value
            option = $('<option>', { value: elementOrValue, selected: !!selected }).text(text || elementOrValue);
        } else {
            // use the passed in element
            option = $(elementOrValue);
            if (text) option.text(text);
            if (selected) option.attr('selected', "true");
        }
        this.element.append(option);
    }

    empty() {
        this.element.find('option').remove();
    }

    refresh() {
        this.element.selectmenu('refresh');
    }
}