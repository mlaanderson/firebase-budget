"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jquerymobile/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class Panel {
    constructor(panel, options) {
        $(() => {
            this.element = $(panel);
            this.element.panel(options);
        });
    }
    on(events, handler) {
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
    off(events, handler) {
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
    close() {
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
    open() {
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
    toggle() {
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
exports.default = Panel;
