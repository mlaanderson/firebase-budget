"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class Select {
    constructor(select) {
        $(() => {
            this.element = $(select);
            this.element.selectmenu();
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
    append(elementOrValue, text, selected) {
        let option;
        if (typeof elementOrValue === "string") {
            // construct the element with the passed value
            option = $('<option>', { value: elementOrValue, selected: !!selected }).text(text || elementOrValue);
        }
        else {
            // use the passed in element
            option = $(elementOrValue);
            if (text)
                option.text(text);
            if (selected)
                option.attr('selected', "true");
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
exports.default = Select;
