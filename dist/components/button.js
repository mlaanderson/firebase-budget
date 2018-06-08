"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("jquery");
class Button {
    constructor(button) {
        $(() => {
            this.element = $(button);
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
    click() {
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
exports.default = Button;
