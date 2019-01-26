"use strict";
/// <reference path="../ejs.d.ts" />
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const renderer_1 = require("./renderer");
class Dialog extends renderer_1.default {
    constructor(filename, data) {
        super();
        this.m_rendered = false;
        this.m_opened = false;
        $(() => {
            this.render(filename, data || {}).then((template) => {
                this.m_dialog = $(template).popup({
                    history: false,
                    overlayTheme: 'b'
                });
                this.m_dialog.on('popupafterclose', () => this.m_opened = false);
                this.m_dialog.on('popupafterclose', this.afterClose.bind(this));
                this.m_dialog.on('popupafteropen', () => this.m_opened = true);
                this.m_dialog.on('popupafteropen', this.afterOpen.bind(this));
                this.fixDateFields();
                this.m_dialog.trigger('create');
                this.m_rendered = true;
                this.afterRender();
            });
        });
    }
    /** Turns date fields into select fields for browser without proper date field support */
    fixDateFields() {
        let fields = this.m_dialog.find('input[type=date]');
        // if there are no date fields, or if date fields are supported, just return
        if ((fields.length <= 0) || (fields[0].type === 'date'))
            return;
        fields.each((n, el) => {
            let input = el;
            let id = input.id || "date-" + n;
            let date = Date.parseFb($(input).val().toString());
            if (input.type == 'hidden')
                return;
            input.type = 'hidden';
            let monthSelect = $('<select data-theme="a" data-inline="true" data-icon="false">', { id: id + '-month' });
            monthSelect.append(Date.MONTHS.map((name, index) => {
                return $('<option>', { value: index + 1, selected: (index == date.getUTCMonth()) }).text(name);
            }));
            let daySelect = $('<select data-theme="a" data-inline="true" data-icon="false">', { id: id + '-day' });
            for (let n = 1; n <= date.daysInMonth(); n++) {
                daySelect.append($('<option>', { value: n, selected: n == date.getUTCDate() }).text(n));
            }
            let yearSelect = $('<select data-theme="a" data-inline="true" data-icon="false">', { id: id + '-year' });
            for (let n = 2016; n <= 2100; n++) {
                yearSelect.append($('<option>', { value: n, selected: n == date.getUTCFullYear() }).text(n));
            }
            function monthVal() {
                let val = parseInt(monthSelect.val());
                if (val >= 10)
                    return val.toString();
                return '0' + val.toString();
            }
            function dayVal() {
                let val = parseInt(daySelect.val());
                if (val >= 10)
                    return val.toString();
                return '0' + val.toString();
            }
            function yearVal() {
                let val = parseInt(yearSelect.val());
                if (val >= 1000)
                    return val.toString();
                if (val >= 100)
                    return '0' + val.toString();
                if (val >= 10)
                    return '00' + val.toString();
                return '000' + val.toString();
            }
            function updateValues() {
                var dateString = yearVal() + '-' + monthVal() + '-' + dayVal();
                console.log(dateString);
                $(input).val(Date.parseFb(dateString).toFbString());
            }
            function updateDays() {
                var dateString = yearVal() + '-' + monthVal() + '-' + dayVal();
                var newDate = Date.parseFb(dateString);
                if (newDate.getUTCMonth() != (monthSelect.val() + 1)) {
                    daySelect.empty();
                    for (let n = 1; n <= newDate.daysInMonth(); n++) {
                        daySelect.append($('<option>', { value: n, selected: n == date.getUTCDate() }).text(n));
                    }
                }
            }
            yearSelect.on('change', updateValues);
            monthSelect.on('change', () => {
                updateDays();
                updateValues();
            });
            daySelect.on('change', updateValues);
            $('<div style="min-height: 44px; width: 100%"></div>').append($('<div class="ui-btn-left" data-role="controlgroup" data-theme="a" data-type="horizontal" data-mini="true"></div>').append(monthSelect, daySelect, yearSelect)).insertAfter(input);
            // monthSelect.insertAfter(input);
            // daySelect.insertAfter(monthSelect);
            // yearSelect.insertAfter(daySelect);
        });
    }
    afterRender() {
        if (this.m_dialog.parent().next().is('.ui-footer')) {
            this.m_dialog.append(this.m_dialog.parent().next()).enhanceWithin();
        }
    }
    afterClose() {
        this.m_dialog.empty().remove();
        $('#main').focus();
    }
    afterOpen() { }
    close() {
        $(() => {
            if (!this.m_rendered) {
                setTimeout(() => this.close(), 100);
                return;
            }
            this.m_dialog.popup('close');
        });
        return this;
    }
    open() {
        $(() => {
            if (!this.m_rendered) {
                setTimeout(() => this.open(), 100);
                return;
            }
            this.m_dialog.popup('open');
        });
        return this;
    }
    position(options) {
        if (this.m_opened === false)
            return this;
        $(() => {
            if (!this.m_rendered) {
                setTimeout(() => this.position(options), 100);
                return;
            }
            this.m_dialog.popup('reposition', options || { positionTo: 'window' });
        });
        return this;
    }
}
exports.default = Dialog;
