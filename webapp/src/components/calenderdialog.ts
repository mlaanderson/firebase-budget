import Dialog from "./dialog";
import Spinner from "./spinner";

type OnValueMethod = (date: Date) => void;
type CalenderOptions = { select: "day" | "week" } | {
    select: "period",
    period: string, 
    start: string
}

export default class CalenderDialog extends Dialog {
    private onvalue: OnValueMethod = () => null;
    private date: Date;
    private btnBackMonth: JQuery<HTMLElement>;
    private btnForwardMonth: JQuery<HTMLElement>;
    private btnBackYear: JQuery<HTMLElement>;
    private btnForwardYear: JQuery<HTMLElement>;
    private monthLabel: JQuery<HTMLElement>;
    private yearLabel: JQuery<HTMLElement>;
    private btnToday: JQuery<HTMLElement>;
    private options: CalenderOptions;

    constructor(date: Date, onvalue: OnValueMethod, options?: CalenderOptions) {
        super('calender', { date: date });
        this.onvalue = onvalue;
        this.date = date;
        this.options = options || { select: "day" };
    }

    static findFirstDisplayed(date: Date) : Date {
        let result = date;

        // get to the first day of the month
        while (result.getUTCDate() > 1) {
            result = result.subtract("1 day") as Date;
        }

        // get to Sunday
        while (result.getUTCDay() > 0) {
            result = result.subtract("1 day") as Date;
        }

        return result;
    }

    private handle_cellOnClick(e: JQuery.Event<HTMLElement, null>) {
        let selected = $(e.target).hasClass('selected'); 
        let date = Date.parseFb($(e.target).attr('value'));
        if (selected || !this.isMobile) {
            switch (this.options.select) {
                case 'week':
                    date = date.subtract(date.getUTCDay() + " days") as Date;
                    break;
                case 'period':
                    date = date.periodCalc(this.options.start, this.options.period);
                    break;
            }
            this.onvalue(date);
            this.close();
        } else {
            this.highlightCells($(e.target));
        }
    }

    private handle_cellOnMouseOver(e: JQuery.Event<HTMLElement, null>) { 
        if (this.isMobile) return;
        this.highlightCells($(e.target));
    }

    private highlightCells(cell: JQuery<HTMLElement>) {
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

    async updateCalender() { 
        let startDate = CalenderDialog.findFirstDisplayed(this.date);
        let fulltemplate = "";
        for (let date = startDate, week = 0; week < 6; week++, date = date.add('1 week')) {
            let template = await this.render('calender-week', { date: this.date, start: date, week: week });
            fulltemplate += template;
        }
        $('.calender-table tbody').empty().append($(fulltemplate));
        this.btnBackMonth.text((this.date.subtract('1 month') as Date).format("MMMM"));
        this.btnForwardMonth.text((this.date.add('1 month') as Date).format("MMMM"));
        this.monthLabel.text(this.date.format('MMMM'));
        this.btnBackYear.text((this.date.subtract('1 year') as Date).format('yyyy'));
        this.btnForwardYear.text((this.date.add('1 year') as Date).format("yyyy"));
        this.yearLabel.text(this.date.format('yyyy'));

        $('.calender-table tbody td').on('click', this.handle_cellOnClick.bind(this));
        $('.calender-table tbody td').on('mouseover', this.handle_cellOnMouseOver.bind(this));

        this.position();

    }

    afterOpen() {
        Spinner.hide();
        this.btnBackMonth = $('#btnBackMonth');
        this.btnBackYear = $('#btnBackYear');
        this.btnForwardMonth = $('#btnForwardMonth');
        this.btnForwardYear = $('#btnForwardYear');
        this.monthLabel = $('#monthLabel');
        this.yearLabel = $('#yearLabel');
        this.btnToday = $('#btnCalToday');

        this.btnBackMonth.on('click', () => {
            this.date = this.date.subtract('1 month') as Date;
            this.updateCalender();
        });

        this.btnForwardMonth.on('click', () => {
            this.date = this.date.add('1 month') as Date;
            this.updateCalender();
        })

        this.btnBackYear.on('click', () => {
            this.date = this.date.subtract('1 year') as Date;
            this.updateCalender();
        });

        this.btnForwardYear.on('click', () => {
            this.date = this.date.add('1 year') as Date;
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