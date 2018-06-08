/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./ejs.d.ts" />

import Application, { Config } from "./app";
import { TransactionStructure, Transaction } from "./types/transaction";
import CashStruct from "./types/cash";
import "./lib/number.ext";
import "./lib/input.ext";
import { RecurringTransaction } from "./types/recurringtransaction";
import {AmChart, AmChartObject, AmChartConfig } from "./amchart/amchart";
import TypeMap from "./types/maps";

interface EventHandler<TCurrentTarget extends EventTarget, TData = null> extends JQuery.EventHandler<TCurrentTarget, TData> {
    preventDefault(): void;
}


export default class Form {
    application: Application;

    btnLogout: JQuery<HTMLElement>;
    btnPrev: JQuery<HTMLElement>;
    btnNext: JQuery<HTMLElement>;
    periodMenu: JQuery<HTMLElement>;
    btnCash: JQuery<HTMLElement>;
    btnReport: JQuery<HTMLElement>;
    btnTransfer: JQuery<HTMLElement>;
    btnAddTransaction: JQuery<HTMLElement>;
    btnEditTransaction: JQuery<HTMLElement>;
    btnNewRecurring: JQuery<HTMLElement>;
    btnDownload: JQuery<HTMLElement>;
    btnConfig: JQuery<HTMLElement>;
    btnToday: JQuery<HTMLElement>
    main: JQuery<HTMLElement>;
    header: JQuery<HTMLElement>;
    footer: JQuery<HTMLElement>;

    activePopup: JQuery<HTMLElement>;

    initializing: boolean = true;

    chart: AmChartObject;
    chart_config: AmChartConfig = {
        "type": "serial",
        "balloonDateFormat": "MMM DD",
        "categoryField": "date",
        "dataDateFormat": "YYYY-MM-DD",
        "maxSelectedSeries": 0,
        "mouseWheelScrollEnabled": true,
        "zoomOutOnDataUpdate": false,
        "maxZoomFactor": 19,
        "zoomOutButtonTabIndex": -2,
        "sequencedAnimation": false,
        "startEffect": "bounce",
        "accessible": false,
        "autoDisplay": true,
        "hideBalloonTime": 2000,
        "theme": "dark",
        "categoryAxis": {
            "position": "top",
            "parseDates": true
        },
        "chartCursor": {
            "enabled": true,
            "animationDuration": 0.25,
            "bulletsEnabled": false,
            "categoryBalloonEnabled": false,
            "categoryBalloonAlpha": 0,
            "fullWidth": false,
            "leaveAfterTouch": false,
            "oneBalloonOnly": true,
            "selectionAlpha": 1
        },
        "chartScrollbar": {
            "enabled": true,
            "dragIcon": "dragIconRoundSmall",
            "graph": "AmGraph-1",
            "gridAlpha": 0,
            "maximum": 5000,
            "minimum": -500,
            "oppositeAxis": true,
            "selectedBackgroundAlpha": 0,
            "updateOnReleaseOnly": true
        },
        "trendLines": [],
        "graphs": [
            {
                "balloonColor": "#FFFFFF",
                "balloonText": "[[description]]",
                "bullet": "square",
                "bulletAxis": "ValueAxis-1",
                "bulletBorderAlpha": 1,
                "bulletField": "amount",
                "bulletHitAreaSize": 2,
                "color": "#000000",
                "colorField": "color",
                "columnWidth": 0,
                "descriptionField": "description",
                "fillAlphas": 0.18,
                "fillColorsField": "color",
                "id": "AmGraph-1",
                "lineAlpha": 1,
                "lineColorField": "color",
                "lineThickness": 2,
                "minDistance": 19,
                "switchable": false,
                "title": "graph 1",
                "type": "step",
                "valueAxis": "ValueAxis-1",
                "valueField": "amount"
            }
        ],
        "guides": [],
        "valueAxes": [
            {
                "id": "ValueAxis-1",
                "title": ""
            }
        ],
        "allLabels": [],
        "balloon": {
            "animationDuration": 0,
            "borderAlpha": 0.96,
            "disableMouseEvents": false,
            "fixedPosition": false,
            "horizontalPadding": 7
        },
        "titles": [],
        "dataProvider": []
    };

    constructor(app : Application) {
        var self = this;
        this.btnLogout = $('#btnLogout').on('click', this.btnLogout_Click.bind(this));
        this.btnPrev = $('#btnPrev').on('click', this.btnPrev_click.bind(this));
        this.btnNext = $('#btnNext').on('click', this.btnNext_click.bind(this));
        this.btnToday = $("#btnToday").on('click', this.btnToday_click.bind(this));
        this.btnCash = $('#btnCash').on('click', this.btnCash_click.bind(this));
        this.btnReport = $('#btnReport').on('click', this.btnReport_click.bind(this));
        this.btnTransfer = $('#btnTransfer').on('click', this.btnTransfer_click.bind(this));
        this.btnAddTransaction = $('#btnAddTransaction').on('click', this.btnAddTransaction_click.bind(this));
        this.btnEditTransaction = $('#btnEditTransaction').on('click', this.btnEditTransaction_click.bind(this));
        this.btnNewRecurring = $('#btnNewRecurring').on('click', this.btnNewRecurring_click.bind(this));
        this.btnDownload = $('#btnDownload').on('click', this.btnDownload_click.bind(this));
        this.btnConfig = $('#btnConfig').on('click', this.btnConfig_click.bind(this));

        this.periodMenu = $('#periodMenu').on('change', this.periodMenu_Change.bind(this));
        this.main = $('#main').on('mouseout', this.main_MouseOut.bind(this));
        this.header = $('[data-role=header]');
        this.footer = $('[data-role=footer]');

        ejs.renderFile('index', {}, (template) => {
            self.main.append($(template));

            // create the strip chart
            this.chart = AmChart.makeChart('chart_div', this.chart_config);
        });

        $(window).on('resize', this.window_Resize.bind(this));

        this.application = app;
    }

    window_Resize(e: EventHandler<HTMLElement>) {
        this.main.css('max-height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
        this.main.css('height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
    }

    async periodMenu_Change(e: EventHandler<HTMLElement>) {
        let transactions = await this.application.gotoPeriod(this.periodMenu.val() as string);
        await this.updateTransactions(transactions);
    }

    main_MouseOut(e: EventHandler<HTMLElement>) {
        setTimeout(() => {
            this.btnEditTransaction.prop('targetId', '');
        }, 150);
    }

    
    btnLogout_Click(e: EventHandler<HTMLElement>) {
        e.preventDefault();
        this.application.signout().then(() => {
            window.location.href = window.location.href;
        });
    }

    async btnPrev_click(e: EventHandler<HTMLElement>) {
        e.preventDefault();
        let start = Date.parseFb(this.application.m_periodStart).subtract(Config.PERIOD_LENGTH) as Date;
        let transactions = await this.application.gotoPeriod(start);

        this.periodMenu.val(start.toFbString());
        await this.updateTransactions(transactions);
    }

    async btnNext_click(e: EventHandler<HTMLElement>) {
        e.preventDefault();
        let start = Date.parseFb(this.application.m_periodStart).add(Config.PERIOD_LENGTH) as Date;
        let transactions = await this.application.gotoPeriod(start);

        this.periodMenu.val(start.toFbString());
        await this.updateTransactions(transactions);
    }

    async btnToday_click(e: EventHandler<HTMLElement>) {
        let start = Date.today();
        let transactions = await this.application.gotoPeriod(start);

        this.periodMenu.val(start.toFbString());
        await this.updateTransactions(transactions);
    }

    async btnCash_click(e: EventHandler<HTMLElement>) {
        let transactions = await this.application.selectPeriod();
        let total = CashStruct.default();
        let sum = 0;

        for (let transaction of transactions) {
            if (transaction.cash == true && transaction.paid == false && transaction.amount < 0) {
                total.add((-transaction.amount).toCash());
                sum -= transaction.amount;
            }
        }

        this.activePopup = await this.dialog('cash', { cash: total, total: sum });
    }

    async btnReport_click(e: EventHandler<HTMLElement>) {
        let transactions = await this.application.selectPeriod();
        let categories: TypeMap<number> = {};
        let total = 0;

        for (let transaction of transactions) {
            if (transaction.amount > 0) continue;

            if (transaction.category in categories === false) {
                categories[transaction.category] = 0;
            }
            categories[transaction.category] += transaction.amount;
            total += transaction.amount;
        }

        total = Math.abs(total);

        this.activePopup = await this.dialog('report', { categories: categories, total: total });
    }

    async btnDownload_click(e: EventHandler<HTMLElement>) {
        let jsonData = await this.application.getData();
        let data = JSON.stringify(jsonData);
        let blob = new Blob([data], { type: 'application/json' });
        let filename = 'budget-' + Date.today().toFbString() + '.json';

        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            let elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            elem.style.display = "none";
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }

    async btnConfig_click(e: EventHandler<HTMLElement>) {
        this.activePopup = await this.dialog('config_v2', Config, () => {
            $('#btnSave').off().on('click', async () => {
                Config.PERIOD_START = $('#date').val().toString();
                Config.PERIOD_LENGTH = $('#period_length').val().toString();
                await Config.write(this.application.root);
            });
        });
    }

    async btnTransfer_click(e: EventHandler<HTMLElement>) {
        let transactions = await this.application.selectPeriod();
        let sum = 0;

        for (let transaction of transactions) {
            if (transaction.transfer == true && transaction.paid == false) {
                sum -= transaction.amount;
            }
        }

        this.activePopup = await this.dialog('transfer', { total: sum });
    }

    btnAddTransaction_click(e: EventHandler<HTMLElement>) {
        this.editTransaction();
    }

    async btnEditTransaction_click(e: EventHandler<HTMLElement>) {
        var id : string = this.btnEditTransaction.prop('targetId');

        if (id !== null && id !== '') {
            this.editTransaction(id);
        }
    }

    btnNewRecurring_click(e: EventHandler<HTMLElement>) {
        this.editRecurring();
    }

    render(path: string, data?: Object) : Promise<string> {
        data = data || {};
        return new Promise((resolve, reject) => {
            ejs.renderFile(path, data, (template) => {
                resolve(template);
            });
        });
    }

    dialog(path: string, data?: Object, afterOpen?: () => void, afterClose?: () => void) : Promise<JQuery<HTMLElement>> {
        data = data || {};
        afterClose = afterClose || (() => {});
        afterOpen = afterOpen || (() => {});
        return new Promise((resolve, reject) => {
            this.render(path, data).then((template) => {
                let dlgPopup = $(template).popup({
                    history: false,
                    overlayTheme: 'b'
                });
                dlgPopup.on('popupafterclose', () => {
                    dlgPopup.empty().remove();
                    afterClose();
                });
                dlgPopup.on('popupafteropen', afterOpen);

                dlgPopup.popup('open');

                resolve(dlgPopup);
            });
        });
    }

    /**
     * Clears the account data from the form
     */
    clear() {
        let self = this;
        
        $('#tblTransactions tbody').empty();

        $('.ui-popup-container').empty().remove();
        $('.ui-popup-screen').empty().remove();
        $('#email').remove();
        $('password').remove();

        this.dialog('login_v2', undefined, () => {
            $('#btnSignIn').off('click').on('click', self.handleLogin.bind(self));

            function handleEnter(e: JQuery.Event<HTMLElement, null>) {
                if (e.keyCode == 13) {
                    self.handleLogin();
                }
            }
    
            $('#username').off('keypress').on('keypress', handleEnter);
            $('#password').off('keypress').on('keypress', handleEnter);
        }).then((popup) => {
            this.activePopup = popup;
        });
    }

    async handleLogin() {

        function login_flash(message: string) {
            $('#errors').text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
        }

        try {
            await this.application.login($('#email').val().toString(), $('#password').val().toString());
            this.activePopup.popup('close');

        } catch (error) {
            switch (error.code) {
                case 'auth/user-disabled':
                    login_flash("Account Disabled");
                    break;
                case 'auth/invalid-email':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    login_flash("Invalid Login");
                    $('#password').val('');
                    $('#email').focus().select();
                    break;
                default:
                    console.log(error);
                    login_flash("Unknown Error");
                    break;
            }
        }
    }

    onConfigLoaded() {
        this.periodMenu.empty();

        for (var start = Date.parseFb(Config.PERIOD_START); start.lt(this.application.m_today.add('5 years')); start = start.add(Config.PERIOD_LENGTH)) {
            this.periodMenu.append(
                $('<option>', { value: start.toFbString() }).text(
                    start.format('M/d') + '-' + 
                    (start.add(Config.PERIOD_LENGTH).subtract("1 day") as Date).format('M/d/yyyy')
                )
            );
        }
    }

    loading() {
        $.mobile.loading();
    }

    doneLoading() {
        $.mobile.loading('hide');
    }

    getRow(e: JQuery.Event) : JQuery<HTMLElement> {
        let target = $(e.target);

        return target.is('tr') ? target : target.parents('tr');
    }

    fixDateFields() {
        let fields = $('input[type=date]');

        // if there are no date fields, or if date fields are supported, just return
        if ((fields.length <= 0) || ((fields[0] as HTMLInputElement).type === 'date')) return;

        fields.each((n, el) => {
            let input = el as HTMLInputElement;
            let id: string = input.id || "date-" + n;
            let date = Date.parseFb($(input).val().toString());

            if (input.type == 'hidden') return;

            input.type = 'hidden';

            let monthSelect = $('<select>', { id: id + '-month' });
            monthSelect.append(Date.MONTHS.map((name, index) => {
                return $('<option>', { value: index + 1, selected: (index == date.getUTCMonth()) }).text(name);
            }));

            let daySelect = $('<select>', { id: id + '-day' });
            for (let n = 1; n <= date.daysInMonth(); n++) {
                daySelect.append($('<option>', { value: n, selected: n == date.getUTCDate() }).text(n));
            }

            let yearSelect = $('<select>', { id: id + '-year' });
            for (let n = 2016; n <= 2100; n++) {
                yearSelect.append($('<option>', { value: n, selected: n == date.getUTCFullYear() }).text(n));
            }

            function monthVal() : string {
                let val =  parseInt(monthSelect.val() as string);
                if (val >= 10) return val.toString();
                return '0' + val.toString();
            }

            function dayVal() : string {
                let val =  parseInt(daySelect.val() as string);
                if (val >= 10) return val.toString();
                return '0' + val.toString();
            }

            function yearVal() : string {
                let val =  parseInt(yearSelect.val() as string);
                if (val >= 1000) return val.toString();
                if (val >= 100) return '0' + val.toString();
                if (val >= 10) return '00' + val.toString();
                return '000' + val.toString();
            }

            function updateValues() {
                var dateString: string = yearVal() + '-' + monthVal() + '-' + dayVal();
                console.log(dateString);
                $(input).val(Date.parseFb(dateString).toFbString());
            }

            function updateDays() {
                var dateString: string = yearVal() + '-' + monthVal() + '-' + dayVal();
                var newDate = Date.parseFb(dateString);

                if (newDate.getUTCMonth() != (monthSelect.val() as number + 1)) {
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

            monthSelect.insertAfter(input);
            daySelect.insertAfter(monthSelect);
            yearSelect.insertAfter(daySelect);
        });
    }

    async updatePreview(transaction: TransactionStructure) {
        if ($('#info_table tbody tr[item=' + transaction.id + ']').length > 0) {
            $('#info_table tbody tr[item=' + transaction.id + '] td.in_date').text(Date.parseFb(transaction.date).format('MMM d, yyyy'));
            $('#info_table tbody tr[item=' + transaction.id + '] td.in_amount').text(transaction.amount.toCurrency());

            var items = await this.application.getSameTransactions(transaction);
            var total = 0;
            for (var item of items) {
                total += item.amount;
            }

            $('.info_div em').text(transaction.name + ' - ' + Math.abs(total).toCurrency());
        }
    }

    async removePreview(id: string) {
        $('#info_table tbody tr[item=' + id + ']').remove();

        if ($('#info_table tbody tr').length > 0) {
            let key = $('#info_table tbody tr').first().attr('item');
            let transaction = await this.application.getTransaction(key);
            let items = await this.application.getSameTransactions(transaction);
            
            var total = 0;
            for (var item of items) {
                total += item.amount;
            }

            $('.info_div em').text(transaction.name + ' - ' + Math.abs(total).toCurrency());
        }
    }

    updateTransaction(transaction: TransactionStructure) {
        // make sure any originals are deleted
        $('#' + transaction.id).remove();

        if (this.application.m_periodStart <= transaction.date && transaction.date <= this.application.m_periodEnd) {
            this.render('singletransaction', { 
                item: transaction,
                hasNote: (typeof transaction.note !== "undefined")
            }).then((template) => {
                // inserting a new transaction into the table

                // add the transaction
                $('#tblTransactions tbody').append($(template));

                // resort the table
                this.sortTransactions();
            });
        }
    }

    removeTransaction(id: string) {
        $('#' + id).remove();
    }

    sortTransactions() {
        let rows = $('#tblTransactions tbody tr');
        let rowArray = rows.toArray();

        rows.remove();

        rowArray.sort((a, b) => {
            let aName = $(a).attr('name'), bName = $(b).attr('name');
            let aCat = Config.CATEGORIES.indexOf($(a).attr('category')), bCat = Config.CATEGORIES.indexOf($(b).attr('category'));

            if (aCat != bCat) return aCat - bCat;
            if (aName > bName) return 1;
            if (aName < bName) return -1;
            return 0;
        });

        $('#tblTransactions tbody').append(rowArray);

        // redecorate the row shading
        let n = 0;
        let category: string;

        rows = $('#tblTransactions tbody tr');
        rows.removeClass('row_0').removeClass('row_1');
        category = rows.first().attr('category');

        rows.each((idx, row) => {
            if ($(row).attr('category') !== category) {
                category = $(row).attr('category');
                n = 1 - n;
            }
            $(row).addClass('row_' + n);
        });        

        this.addTransactionHandlers();
    }

    addTransactionHandlers() {
        // update handlers
        $('#tblTransactions tbody tr')
            .off('mouseover').on('mouseover', this.transaction_OnMouseOver.bind(this))
            .off('mouseout').on('mouseout', this.transaction_OnMouseOut.bind(this))
            .off('click').on('click', this.transaction_Click.bind(this))
            .off('dblclick').on('dblclick', this.transaction_DblClick.bind(this));
        $('.recurring').off('click').on('click', this.recurring_click.bind(this));
    }

    updateTotal(total: number) {
        $('#total_calc').text(total.toCurrency());
    }

    async updateTransactions(items : Array<TransactionStructure>) {
        let promises = new Array<Promise<void>>();
        $('#tblTransactions tbody').empty();
        $('.info_div').empty();
        this.periodMenu.val(this.application.m_periodStart);
        this.periodMenu.selectmenu('refresh');

        for (var transaction of items) {
            promises.push(this.render('singletransaction', { item: transaction }).then((template) => {
                $('#tblTransactions tbody').append($(template));
            }));
        }

        Promise.all(promises).then(() => {
            this.sortTransactions();
            this.doneLoading();
            if (this.initializing === true) {
                this.window_Resize(null);
                this.initializing = false;
            }
            document.title = Date.parseFb(this.application.m_periodStart).format("MMM d") + ' - ' + Date.parseFb(this.application.m_periodEnd).format("MMM d");
        });

        this.updateTotal(await this.application.getPeriodSum());
        await this.updateChart();
    }

    async updateChart() {
        if ($('#footer_info').css('display') === "none") return;
        let sums = await this.application.getDateTotals();
        this.chart.dataProvider = [];

        // let dates = Object.keys(sums);
        // dates.sort();

        // let start = Date.parseFb(dates[0]);
        // let end = Date.parseFb(dates[dates.length - 1]);
        // let value = sums[dates[0]];

        // for (let date = start; date.le(end); date = date.add("1 day") as Date) {
        //     if (date.toFbString() in sums) {
        //         value = sums[date.toFbString()];
        //     } else {
        //         sums[date.toFbString()] = value;
        //     }
        // }
        
        for (var date in sums) {
            let trDate = Date.parseFb(date);
            this.chart.dataProvider.push({
                date: date,
                amount: sums[date],
                description: trDate.format("MMM dd") + ": " + sums[date].toCurrency(),
                color: (sums[date] < 0 ? "#ff0000" : "#008800")
            });
        }

        this.chart.dataProvider.sort((a, b) => {
            if (a.date > b.date) return 1;
            if (b.date > a.date) return -1;
            return 0;
        });

        let chLeft = Date.parseFb(this.application.m_periodStart).subtract('2 weeks') as Date;
        let chRight = Date.parseFb(this.application.m_periodEnd).add('3 months') as Date;

        this.chart.validateData();
        this.chart.zoomToDates(chLeft, chRight);
    }

    transaction_OnMouseOver(e: JQuery.Event) {
        $('#tblTransactions tbody tr').css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
    }

    transaction_OnMouseOut() {
        $('#tblTransactions tbody tr').css('background-color', '');
    }

    async transaction_DblClick(e: JQuery.Event) {
        e.preventDefault();
        var id : string = this.getRow(e).attr('id');

        this.editTransaction(id);
    }

    async transaction_Click(e: JQuery.Event) {
        e.preventDefault(); 
        var id : string = this.getRow(e).attr('id');
        
        // get the transaction previews
        var item = await this.application.getTransaction(id);

        if (item !== null) {
            // select this transaction for the editor
            this.btnEditTransaction.prop('targetId', id); 

            var items = await this.application.getSameTransactions(item);
            this.render('info_v2', { title: item.name, items: items }).then((template) => {
                $('.info_div').empty().append($(template));
                $('#info_table tbody tr').on('mouseover', (e: JQuery.Event) => {
                    $('#info_table tbody tr').css('background-color', '');
                    this.getRow(e).css('background-color', '#eef');
                }).on('mouseout', () => {
                    $('#info_table tbody tr').css('background-color', '');
                }).on('click', async (e: JQuery.Event) => {
                    // Jump
                    let nextId = this.getRow(e).attr('item');
                    let nextTransaction = await this.application.getTransaction(nextId);
                    let transactions = await this.application.gotoPeriod(nextTransaction.date);
                    this.updateTransactions(transactions);
                });
                this.window_Resize(null);
            });
        }
    }

    async recurring_click(e: JQuery.Event) {
        var target = $(e.target);
        var row = this.getRow(e);

        this.editRecurring(target.attr('recurring'));
    }

    async editTransaction(id?: string) {
        let transaction: TransactionStructure;
        
        if (id) {
            transaction = await this.application.getTransaction(id);
        } else {
            transaction = new Transaction().toJSON();
            transaction.date = this.application.m_periodStart;
        }

        this.activePopup = await this.dialog('edittransaction_v2', transaction, async () => {
            this.fixDateFields();
            $('#btnSave').on('click', async () => {
                // collect the updated data
                let isDeposit = $("#type").prop('checked') as boolean;

                transaction.date = $('#date').val().toString();
                transaction.category = $('#category').val().toString();
                transaction.name = $('#name').val().toString();
                transaction.amount = ($('#amount').val() as number) * (isDeposit ? 1 : -1);
                transaction.cash = ($('#cash').prop('checked') as boolean) && (isDeposit == false);
                transaction.transfer = $('#transfer').prop('checked') as boolean;
                transaction.paid = $('#paid').prop('checked') as boolean;
                transaction.note = $('#note').val().toString();
                transaction.check = $('#checkNumber').val().toString();
                transaction.checkLink = $('#checkLink').val().toString();           
                
                // save the transaction
                await this.application.saveTransaction(transaction);

                // close the dialog
                this.activePopup.popup('close');
            });
            $('#btnDelete').on('click', () => {
                // delete the transaction
                this.application.deleteTransaction(transaction.id);

                // close the dialog
                this.activePopup.popup('close');
            });
            $('#transactionEditor input').on('keypress', (e) => {
                if (e.charCode == 13) {
                    e.preventDefault();
                    $('#btnSave').click();
                }
            });
        });
    }

    async editRecurring(recurringId?: string) {

        let recurring: RecurringTransaction;
        
        if (recurringId) {
            recurring = await this.application.getRecurringTransaction(recurringId);
        } else {
            let startDate = Date.max(Date.parseFb(this.application.m_periodStart), Date.today());
            recurring = {
                start: startDate.toFbString(),
                end: startDate.add("1 year").toFbString(),
                period: "1 month",
                category: Config.CATEGORIES[0],
                name: "",
                amount: 0,
                cash: false,
                transfer: false,
                note: null
            };
        }
        
        this.activePopup = await this.dialog('editrecurring_v2', recurring, async () => {
            this.fixDateFields();
            $('#btnSave').on('click', async () => {
                // collect the updated data
                let isDeposit = $("#type").prop('checked') as boolean;

                recurring.period = $('#period').val().toString();
                recurring.start = $('#start').val().toString();
                recurring.end = $('#end').val().toString();
                recurring.category = $('#category').val().toString();
                recurring.name = $('#name').val().toString();
                recurring.amount = ($('#amount').val() as number) * (isDeposit ? 1 : -1);
                recurring.cash = ($('#cash').prop('checked') as boolean) && (isDeposit == false);
                recurring.transfer = $('#transfer').prop('checked') as boolean;
                recurring.note = $('#note').val().toString();

                // save the transaction
                await this.application.saveRecurringTransaction(recurring);

                // close the dialog
                this.activePopup.popup('close');
            });
            $('#btnDelete').on('click', () => {
                // delete the recurring transaction
                this.application.deleteRecurring(recurring.id);

                // close the dialog
                this.activePopup.popup('close');
            });
            $('#transactionEditor input').on('keypress', (e) => {
                if (e.charCode == 13) {
                    e.preventDefault();
                    $('#btnSave').click();
                }
            });
        });
    }
}