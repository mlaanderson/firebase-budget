"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class Select {
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
    val(value) {
        if (value) {
            $(() => {
                this.element.val(value);
            });
            return this;
        }
        else {
            return this.element ? this.element.val().toString() : null;
        }
    }
}
exports.default = Select;
