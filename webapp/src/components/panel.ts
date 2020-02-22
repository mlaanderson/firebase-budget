/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jquerymobile/index.d.ts" />

export default class Panel {
    protected element : JQuery<HTMLElement>;

    constructor(panel: string | HTMLElement | JQuery<HTMLElement>, options?: {
        animate?: boolean;
        disabled?: boolean;
        dismissible?: boolean;
        display?: "reveal" | "push" | "overlay";
        initSelector?: string;
        position?: "left" | "right";
        positionFixed?: boolean;
        swipeClose?: boolean;
        theme?: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
    }) {
        $(() => {
            this.element = $(panel);
            this.element.panel(options);
        });
    }

    on(events: string, handler: (e: JQueryEventObject) => void) : Panel {
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

    off(events: string, handler: false | JQuery.EventHandlerBase<any, JQuery.Event<HTMLElement, any>>) : Panel {
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

    close() : Panel {
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.close();
                }, 100);
                return;
            }
            this.element.panel('close');
        });
        return this;
    }

    open() : Panel {
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.open();
                }, 100);
                return;
            }
            this.element.panel('open');
        });
        return this;
    }

    toggle() : Panel {
        $(() => {
            if (!this.element) {
                setTimeout(() => {
                    this.toggle();
                }, 100);
                return;
            }
            this.element.panel('toggle');
        });
        return this;
    }
}