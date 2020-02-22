"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
const spinner_1 = require("./spinner");
class CalenderDialog extends dialog_1.default {
    constructor(date, onvalue, options) {
        super('calender', { date: date });
        this.onvalue = () => null;
        this.onvalue = onvalue;
        this.date = date;
        this.options = options || { select: "day" };
    }
    static findFirstDisplayed(date) {
        let result = date;
        // get to the first day of the month
        while (result.getUTCDate() > 1) {
            result = result.subtract("1 day");
        }
        // get to Sunday
        while (result.getUTCDay() > 0) {
            result = result.subtract("1 day");
        }
        return result;
    }
    handle_cellOnClick(e) {
        let selected = $(e.target).hasClass('selected');
        let date = Date.parseFb($(e.target).attr('value'));
        if (selected || !this.isMobile) {
            switch (this.options.select) {
                case 'week':
                    date = date.subtract(date.getUTCDay() + " days");
                    break;
                case 'period':
                    date = date.periodCalc(this.options.start, this.options.period);
                    break;
            }
            this.onvalue(date);
            this.close();
        }
        else {
            this.highlightCells($(e.target));
        }
    }
    handle_cellOnMouseOver(e) {
        if (this.isMobile)
            return;
        this.highlightCells($(e.target));
    }
    highlightCells(cell) {
        $('.calender-table tbody td').removeClass('calender-hover').removeClass('selected');
        switch (this.options.select) {
            case "day":
                cell.addClass('calender-hover').addClass('selected');
                break;
            case "week":
                cell.parent('tr').children('td').addClass('calender-hover').addClass('selected');
                break;
            case "period":
                let begin = Date.parseFb(cell.attr('value')).periodCalc(this.options.start, this.options.period);
                for (let date = begin; date.lt(begin.add(this.options.period)); date = date.add('1 day')) {
                    $('.calender-table tbody td[value=' + date.toFbString() + ']').addClass('calender-hover').addClass('selected');
                }
                break;
        }
    }
    updateCalender() {
        return __awaiter(this, void 0, void 0, function* () {
            let startDate = CalenderDialog.findFirstDisplayed(this.date);
            let fulltemplate = "";
            for (let date = startDate, week = 0; week < 6; week++, date = date.add('1 week')) {
                let template = yield this.render('calender-week', { date: this.date, start: date, week: week });
                fulltemplate += template;
            }
            $('.calender-table tbody').empty().append($(fulltemplate));
            this.btnBackMonth.text(this.date.subtract('1 month').format("MMMM"));
            this.btnForwardMonth.text(this.date.add('1 month').format("MMMM"));
            this.monthLabel.text(this.date.format('MMMM'));
            this.btnBackYear.text(this.date.subtract('1 year').format('yyyy'));
            this.btnForwardYear.text(this.date.add('1 year').format("yyyy"));
            this.yearLabel.text(this.date.format('yyyy'));
            $('.calender-table tbody td').on('click', this.handle_cellOnClick.bind(this));
            $('.calender-table tbody td').on('mouseover', this.handle_cellOnMouseOver.bind(this));
            this.position();
        });
    }
    afterOpen() {
        spinner_1.default.hide();
        this.btnBackMonth = $('#btnBackMonth');
        this.btnBackYear = $('#btnBackYear');
        this.btnForwardMonth = $('#btnForwardMonth');
        this.btnForwardYear = $('#btnForwardYear');
        this.monthLabel = $('#monthLabel');
        this.yearLabel = $('#yearLabel');
        this.btnToday = $('#btnCalToday');
        this.btnBackMonth.on('click', () => {
            this.date = this.date.subtract('1 month');
            this.updateCalender();
        });
        this.btnForwardMonth.on('click', () => {
            this.date = this.date.add('1 month');
            this.updateCalender();
        });
        this.btnBackYear.on('click', () => {
            this.date = this.date.subtract('1 year');
            this.updateCalender();
        });
        this.btnForwardYear.on('click', () => {
            this.date = this.date.add('1 year');
            this.updateCalender();
        });
        this.btnToday.on('click', () => {
            this.date = Date.today();
            this.updateCalender();
        });
        this.updateCalender();
        if (this.isMobile) {
            setTimeout(() => {
                // highlight 
                let cell = $('.calender-table tbody td[value=' + this.date.toFbString() + ']');
                if (cell.length > 0) {
                    this.highlightCells(cell);
                }
            }, 100);
        }
    }
}
exports.default = CalenderDialog;
