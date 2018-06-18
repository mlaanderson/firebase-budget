"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class Button {
    constructor(button) {
        $(() => {
            this.element = $(button);
        });
        this.m_disabled = false;
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
    get disabled() {
        return this.m_disabled;
    }
    set disabled(value) {
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
            }
            else {
                this.element.removeClass('ui-disabled');
            }
        });
    }
}
exports.default = Button;
