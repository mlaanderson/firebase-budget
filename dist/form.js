"use strict";
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./ejs.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const transaction_1 = require("./types/transaction");
const cash_1 = require("./types/cash");
require("./lib/number.ext");
require("./lib/input.ext");
const amchart_1 = require("./amchart/amchart");
class Form {
    constructor(app) {
        this.chart_config = {
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
        var self = this;
        this.btnLogout = $('#btnLogout').on('click', this.btnLogout_Click.bind(this));
        this.btnPrev = $('#btnPrev').on('click', this.btnPrev_click.bind(this));
        this.btnNext = $('#btnNext').on('click', this.btnNext_click.bind(this));
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
            this.chart = amchart_1.AmChart.makeChart('chart_div', this.chart_config);
        });
        $(window).on('resize', this.window_Resize.bind(this));
        this.application = app;
    }
    window_Resize(e) {
        this.main.css('max-height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
        this.main.css('height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
    }
    periodMenu_Change(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = yield this.application.gotoPeriod(this.periodMenu.val());
            yield this.updateTransactions(transactions);
        });
    }
    main_MouseOut(e) {
        setTimeout(() => {
            this.btnEditTransaction.prop('targetId', '');
        }, 150);
    }
    btnLogout_Click(e) {
        e.preventDefault();
        this.application.signout().then(() => {
            window.location.href = window.location.href;
        });
    }
    btnPrev_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            let start = Date.parseFb(this.application.m_periodStart).subtract(app_1.Config.PERIOD_LENGTH);
            let transactions = yield this.application.gotoPeriod(start);
            this.periodMenu.val(start.toFbString());
            yield this.updateTransactions(transactions);
        });
    }
    btnNext_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            let start = Date.parseFb(this.application.m_periodStart).add(app_1.Config.PERIOD_LENGTH);
            let transactions = yield this.application.gotoPeriod(start);
            this.periodMenu.val(start.toFbString());
            yield this.updateTransactions(transactions);
        });
    }
    btnCash_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = yield this.application.selectPeriod();
            let total = cash_1.default.default();
            let sum = 0;
            for (let transaction of transactions) {
                if (transaction.cash == true && transaction.paid == false && transaction.amount < 0) {
                    total.add((-transaction.amount).toCash());
                    sum -= transaction.amount;
                }
            }
            this.activePopup = yield this.dialog('cash', { cash: total, total: sum });
        });
    }
    btnReport_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = yield this.application.selectPeriod();
            let categories = {};
            let total = 0;
            for (let transaction of transactions) {
                if (transaction.amount > 0)
                    continue;
                if (transaction.category in categories === false) {
                    categories[transaction.category] = 0;
                }
                categories[transaction.category] += transaction.amount;
                total += transaction.amount;
            }
            total = Math.abs(total);
            this.activePopup = yield this.dialog('report', { categories: categories, total: total });
        });
    }
    btnDownload_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let jsonData = yield this.application.getData();
            let data = JSON.stringify(jsonData);
            let blob = new Blob([data], { type: 'application/json' });
            let filename = 'budget-' + Date.today().toFbString() + '.json';
            if (window.navigator.msSaveBlob) {
                window.navigator.msSaveBlob(blob, filename);
            }
            else {
                let elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = filename;
                elem.style.display = "none";
                document.body.appendChild(elem);
                elem.click();
                document.body.removeChild(elem);
            }
        });
    }
    btnConfig_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            this.activePopup = yield this.dialog('config_v2', app_1.Config, () => {
                $('#btnSave').off().on('click', () => __awaiter(this, void 0, void 0, function* () {
                    app_1.Config.PERIOD_START = $('#date').val().toString();
                    app_1.Config.PERIOD_LENGTH = $('#period_length').val().toString();
                    yield app_1.Config.write(this.application.root);
                }));
            });
        });
    }
    btnTransfer_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = yield this.application.selectPeriod();
            let sum = 0;
            for (let transaction of transactions) {
                if (transaction.transfer == true && transaction.paid == false) {
                    sum -= transaction.amount;
                }
            }
            this.activePopup = yield this.dialog('transfer', { total: sum });
        });
    }
    btnAddTransaction_click(e) {
        this.editTransaction();
    }
    btnEditTransaction_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            var id = this.btnEditTransaction.prop('targetId');
            if (id !== null && id !== '') {
                this.editTransaction(id);
            }
        });
    }
    btnNewRecurring_click(e) {
        this.editRecurring();
    }
    render(path, data) {
        data = data || {};
        return new Promise((resolve, reject) => {
            ejs.renderFile(path, data, (template) => {
                resolve(template);
            });
        });
    }
    dialog(path, data, afterOpen, afterClose) {
        data = data || {};
        afterClose = afterClose || (() => { });
        afterOpen = afterOpen || (() => { });
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
            function handleEnter(e) {
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
    handleLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            function login_flash(message) {
                $('#errors').text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }
            try {
                yield this.application.login($('#email').val().toString(), $('#password').val().toString());
                this.activePopup.popup('close');
            }
            catch (error) {
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
        });
    }
    onConfigLoaded() {
        this.periodMenu.empty();
        for (var start = Date.parseFb(app_1.Config.PERIOD_START); start.lt(this.application.m_today.add('5 years')); start = start.add(app_1.Config.PERIOD_LENGTH)) {
            this.periodMenu.append($('<option>', { value: start.toFbString() }).text(start.format('M/d') + '-' +
                start.add(app_1.Config.PERIOD_LENGTH).subtract("1 day").format('M/d/yyyy')));
        }
    }
    loading() {
        $.mobile.loading();
    }
    doneLoading() {
        $.mobile.loading('hide');
    }
    getRow(e) {
        let target = $(e.target);
        return target.is('tr') ? target : target.parents('tr');
    }
    fixDateFields() {
        let fields = $('input[type=date]');
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
            function updateValues() {
                var dateString = yearSelect.val().toString() + '-' + monthSelect.val().toString() + '-' + daySelect.val().toString();
                $(input).val(Date.parseFb(dateString).toFbString());
            }
            function updateDays() {
                var dateString = yearSelect.val().toString() + '-' + monthSelect.val().toString() + '-' + daySelect.val().toString();
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
            monthSelect.insertAfter(input);
            daySelect.insertAfter(monthSelect);
            yearSelect.insertAfter(daySelect);
        });
    }
    updatePreview(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ($('#info_table tbody tr[item=' + transaction.id + ']').length > 0) {
                $('#info_table tbody tr[item=' + transaction.id + '] td.in_date').text(Date.parseFb(transaction.date).format('MMM d, yyyy'));
                $('#info_table tbody tr[item=' + transaction.id + '] td.in_amount').text(transaction.amount.toCurrency());
                var items = yield this.application.getSameTransactions(transaction);
                var total = 0;
                for (var item of items) {
                    total += item.amount;
                }
                $('.info_div em').text(transaction.name + ' - ' + Math.abs(total).toCurrency());
            }
        });
    }
    removePreview(id) {
        return __awaiter(this, void 0, void 0, function* () {
            $('#info_table tbody tr[item=' + id + ']').remove();
            if ($('#info_table tbody tr').length > 0) {
                let key = $('#info_table tbody tr').first().attr('item');
                let transaction = yield this.application.getTransaction(key);
                let items = yield this.application.getSameTransactions(transaction);
                var total = 0;
                for (var item of items) {
                    total += item.amount;
                }
                $('.info_div em').text(transaction.name + ' - ' + Math.abs(total).toCurrency());
            }
        });
    }
    updateTransaction(transaction) {
        this.render('singletransaction', {
            item: transaction,
            hasNote: (typeof transaction.note !== "undefined")
        }).then((template) => {
            // inserting a new transaction into the table
            // make sure any originals are deleted
            $('#' + transaction.id).remove();
            // add the transaction
            $('#tblTransactions tbody').append($(template));
            // resort the table
            this.sortTransactions();
        });
    }
    removeTransaction(id) {
        $('#' + id).remove();
    }
    sortTransactions() {
        let rows = $('#tblTransactions tbody tr');
        let rowArray = rows.toArray();
        rows.remove();
        rowArray.sort((a, b) => {
            let aName = $(a).attr('name'), bName = $(b).attr('name');
            let aCat = app_1.Config.CATEGORIES.indexOf($(a).attr('category')), bCat = app_1.Config.CATEGORIES.indexOf($(b).attr('category'));
            if (aCat != bCat)
                return aCat - bCat;
            if (aName > bName)
                return 1;
            if (aName < bName)
                return -1;
            return 0;
        });
        $('#tblTransactions tbody').append(rowArray);
        // redecorate the row shading
        let n = 0;
        let category;
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
    updateTotal(total) {
        $('#total_calc').text(total.toCurrency());
    }
    updateTransactions(items) {
        return __awaiter(this, void 0, void 0, function* () {
            let promises = new Array();
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
                document.title = Date.parseFb(this.application.m_periodStart).format("MMM d") + ' - ' + Date.parseFb(this.application.m_periodEnd).format("MMM d");
            });
            this.updateTotal(yield this.application.getPeriodSum());
            yield this.updateChart();
        });
    }
    updateChart() {
        return __awaiter(this, void 0, void 0, function* () {
            if ($('#footer_info').css('display') === "none")
                return;
            let sums = yield this.application.getDateTotals();
            this.chart.dataProvider = [];
            let dates = Object.keys(sums);
            dates.sort();
            let start = Date.parseFb(dates[0]);
            let end = Date.parseFb(dates[dates.length - 1]);
            let value = sums[dates[0]];
            for (let date = start; date.le(end); date = date.add("1 day")) {
                if (date.toFbString() in sums) {
                    value = sums[date.toFbString()];
                }
                else {
                    sums[date.toFbString()] = value;
                }
            }
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
                if (a.date > b.date)
                    return 1;
                if (b.date > a.date)
                    return -1;
                return 0;
            });
            let chLeft = Date.parseFb(this.application.m_periodStart).subtract('2 weeks');
            let chRight = Date.parseFb(this.application.m_periodEnd).add('3 months');
            this.chart.validateData();
            this.chart.zoomToDates(chLeft, chRight);
        });
    }
    transaction_OnMouseOver(e) {
        $('#tblTransactions tbody tr').css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
    }
    transaction_OnMouseOut() {
        $('#tblTransactions tbody tr').css('background-color', '');
    }
    transaction_DblClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            var id = this.getRow(e).attr('id');
            this.editTransaction(id);
        });
    }
    transaction_Click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            var id = this.getRow(e).attr('id');
            // get the transaction previews
            var item = yield this.application.getTransaction(id);
            if (item !== null) {
                // select this transaction for the editor
                this.btnEditTransaction.prop('targetId', id);
                var items = yield this.application.getSameTransactions(item);
                this.render('info_v2', { title: item.name, items: items }).then((template) => {
                    $('.info_div').empty().append($(template));
                    $('#info_table tbody tr').on('mouseover', (e) => {
                        $('#info_table tbody tr').css('background-color', '');
                        this.getRow(e).css('background-color', '#eef');
                    }).on('mouseout', () => {
                        $('#info_table tbody tr').css('background-color', '');
                    }).on('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        // Jump
                        let nextId = this.getRow(e).attr('item');
                        let nextTransaction = yield this.application.getTransaction(nextId);
                        let transactions = yield this.application.gotoPeriod(nextTransaction.date);
                        this.updateTransactions(transactions);
                    }));
                });
            }
        });
    }
    recurring_click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            var target = $(e.target);
            var row = this.getRow(e);
            this.editRecurring(target.attr('recurring'));
        });
    }
    editTransaction(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction;
            if (id) {
                transaction = yield this.application.getTransaction(id);
            }
            else {
                transaction = new transaction_1.Transaction().toJSON();
                transaction.date = this.application.m_periodStart;
            }
            this.activePopup = yield this.dialog('edittransaction_v2', transaction, () => __awaiter(this, void 0, void 0, function* () {
                this.fixDateFields();
                $('#btnSave').on('click', () => __awaiter(this, void 0, void 0, function* () {
                    // collect the updated data
                    let isDeposit = $("#type").prop('checked');
                    transaction.date = $('#date').val().toString();
                    transaction.category = $('#category').val().toString();
                    transaction.name = $('#name').val().toString();
                    transaction.amount = $('#amount').val() * (isDeposit ? 1 : -1);
                    transaction.cash = $('#cash').prop('checked') && (isDeposit == false);
                    transaction.transfer = $('#transfer').prop('checked');
                    transaction.paid = $('#paid').prop('checked');
                    transaction.note = $('#note').val().toString();
                    transaction.check = $('#checkNumber').val().toString();
                    transaction.checkLink = $('#checkLink').val().toString();
                    // save the transaction
                    yield this.application.saveTransaction(transaction);
                    // close the dialog
                    this.activePopup.popup('close');
                }));
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
            }));
        });
    }
    editRecurring(recurringId) {
        return __awaiter(this, void 0, void 0, function* () {
            let recurring;
            if (recurringId) {
                recurring = yield this.application.getRecurringTransaction(recurringId);
            }
            else {
                let startDate = Date.max(Date.parseFb(this.application.m_periodStart), Date.today());
                recurring = {
                    start: startDate.toFbString(),
                    end: startDate.add("1 year").toFbString(),
                    period: "1 month",
                    category: app_1.Config.CATEGORIES[0],
                    name: "",
                    amount: 0,
                    cash: false,
                    transfer: false,
                    note: null
                };
            }
            this.activePopup = yield this.dialog('editrecurring_v2', recurring, () => __awaiter(this, void 0, void 0, function* () {
                this.fixDateFields();
                $('#btnSave').on('click', () => __awaiter(this, void 0, void 0, function* () {
                    // collect the updated data
                    let isDeposit = $("#type").prop('checked');
                    recurring.period = $('#period').val().toString();
                    recurring.start = $('#start').val().toString();
                    recurring.end = $('#end').val().toString();
                    recurring.category = $('#category').val().toString();
                    recurring.name = $('#name').val().toString();
                    recurring.amount = $('#amount').val() * (isDeposit ? 1 : -1);
                    recurring.cash = $('#cash').prop('checked') && (isDeposit == false);
                    recurring.transfer = $('#transfer').prop('checked');
                    recurring.note = $('#note').val().toString();
                    // save the transaction
                    yield this.application.saveRecurringTransaction(recurring);
                    // close the dialog
                    this.activePopup.popup('close');
                }));
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
            }));
        });
    }
}
exports.default = Form;
