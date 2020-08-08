"use strict";
/// <reference path="../ejs.d.ts" />
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const renderer_1 = require("./renderer");
const spinner_1 = require("./spinner");
const modalspinner_1 = require("./modalspinner");
const transactioneditor_1 = require("./transactioneditor");
const recurringtransactioneditor_1 = require("./recurringtransactioneditor");
const TEMPLATE = "singletransaction";
class TransactionList extends renderer_1.default {
    constructor(element, config) {
        super();
        this.m_update = true;
        this.SaveTransaction = (transaction) => __awaiter(this, void 0, void 0, function* () { console.log("SAVETRANSACTION", transaction); return null; });
        this.LoadTransaction = (id) => __awaiter(this, void 0, void 0, function* () { console.log("LOADTRANSACTION:", id); return null; });
        this.DeleteTransaction = (id) => __awaiter(this, void 0, void 0, function* () { console.log("DELETETRANSACTION", id); return null; });
        this.PreviewTransaction = (id) => __awaiter(this, void 0, void 0, function* () { console.log("PREVIEWTRANSACTION", id); return null; });
        this.LoadNames = () => __awaiter(this, void 0, void 0, function* () { console.log("LOADNAMES"); return []; });
        this.SaveRecurring = (transaction) => __awaiter(this, void 0, void 0, function* () { console.log("SAVERECURRING", transaction); return null; });
        this.LoadRecurring = (id) => __awaiter(this, void 0, void 0, function* () { console.log("LOADRECURRING:", id); return null; });
        this.DeleteRecurring = (id) => __awaiter(this, void 0, void 0, function* () { console.log("DELETERECURRING", id); return null; });
        this.m_config = config;
        $(() => {
            this.m_element = $(element).children('tbody');
            this.m_tooltip = $(element).siblings('.tooltip');
            $(window).on('resize', this.window_onResize);
        });
    }
    window_onResize() {
        $('#main').css('max-height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
        $('#main').css('height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
        setImmediate(() => {
            console.log('setting info_div height', Math.max($('#tblTransactions').height(), $('#main').height()) + 'px');
            $('.info_div').css('max-height', Math.max($('#tblTransactions').height(), $('#main').height()) + 'px');
        });
    }
    sorter(a, b) {
        let idxA = this.m_config.categories.indexOf(a.category);
        let idxB = this.m_config.categories.indexOf(b.category);
        if (idxA != idxB)
            return idxA - idxB;
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        if (a.amount && b.amount) {
            return b.amount - a.amount;
        }
        return 0;
    }
    rowSorter(a, b) {
        return this.sorter({ category: $(a).attr('category'), name: $(a).attr('name'), amount: parseFloat($(a).attr('amount')) }, { category: $(b).attr('category'), name: $(b).attr('name'), amount: parseFloat($(b).attr('amount')) });
    }
    getRow(e) {
        return $(e.target).is('tr') ? $(e.target) : $(e.target).parents('tr').first();
    }
    addListeners() {
        this.m_element.children('tr').off();
        this.m_element.find('span.recurring').off();
        this.m_element.find('[data-title]').off();
        this.m_element.find('[data-title]').children().off();
        this.m_element.children('tr').on('mouseover', this.onMouseOver.bind(this));
        this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
        this.m_element.children('tr').on('click', this.onClick.bind(this));
        this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
        this.m_element.find('span.recurring').on('click', this.onRecurringClick.bind(this));
    }
    findTitleElement(e) {
        if ($(e.target).parent().jqmData('title'))
            return $(e.target).parent();
        return $(e.target);
    }
    onMouseOutTitle(e) {
        let target = this.findTitleElement(e);
        if (target.jqmData('title')) {
            target.data('titleShow', false);
            this.m_tooltip.css('display', 'none');
        }
    }
    onMouseOverTitle(e) {
        console.log(e);
        let target = this.findTitleElement(e);
        if (target.jqmData('title')) {
            if (target.data('titleShow') !== true) {
                this.m_tooltip.text(target.jqmData('title'));
                this.m_tooltip.css({ 'display': '', 'top': (e.clientY - 20) + 'px', 'left': (e.clientX) + 'px' });
            }
            target.data('titleShow', true);
        }
    }
    editTransaction(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.LoadTransaction(id);
            let names = yield this.LoadNames();
            if (transaction != null) {
                let editor = new transactioneditor_1.default(transaction, this.SaveTransaction, this.DeleteTransaction, this.m_config.categories, names);
                editor.open();
            }
        });
    }
    editRecurring(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.LoadRecurring(id);
            let names = yield this.LoadNames();
            if (transaction != null) {
                let editor = new recurringtransactioneditor_1.default(transaction, this.SaveRecurring, this.DeleteRecurring, this.m_config.categories, names);
                editor.open();
            }
        });
    }
    get totalElement() {
        return $(this.m_element).parent().find('tfoot th#total_calc');
    }
    get balanceElement() {
        return $(this.m_element).parent().find('tfoot th#balance_calc');
    }
    get rows() {
        return this.m_element.children('tr');
    }
    // events
    onMouseOver(e) {
        this.rows.css('background-color', '');
        this.rows.children('td').css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
        this.getRow(e).children('td').css('background-color', '#eef');
    }
    onMouseOut() {
        this.rows.css('background-color', '');
        this.rows.children('td').css('background-color', '');
    }
    onDoubleClick(e) {
        e.preventDefault();
        let id = this.getRow(e).attr('id');
        this.editTransaction(id);
    }
    onClick(e) {
        e.preventDefault();
        this.m_active_id = this.getRow(e).css('background-color', '#eef').attr('id');
        this.getRow(e).children('td').css('background-color', '#eef');
        this.PreviewTransaction(this.m_active_id);
    }
    onRecurringClick(e) {
        e.preventDefault();
        let target = $(e.target);
        if (target.is('span.recurring') == false) {
            target = target.parents('span.recurring');
        }
        if (target.is('span.recurring') === false)
            return;
        let id = target.attr('recurring');
        this.editRecurring(id);
    }
    // methods
    setTotal(total) {
        $(() => {
            this.totalElement.text("Budget Balance: " + total.toCurrency());
        });
    }
    setBalance(balance) {
        $(() => {
            this.balanceElement.text("Bank Balance: " + balance.toCurrency());
        });
    }
    editSelected() {
        if (this.m_active_id) {
            this.editTransaction(this.m_active_id);
        }
    }
    display(transactions, total, balance) {
        let list = [];
        for (let id in transactions) {
            list.push(transactions[id]);
        }
        this.displayList(list, total, balance);
    }
    updateRows() {
        // get the rows as an array
        let rows = this.rows.toArray();
        // empty the table
        this.m_element.empty();
        // sort the rows
        rows.sort(this.rowSorter.bind(this));
        // add the rows again
        this.m_element.append(rows);
        // setup the alternate row classes
        if (this.m_element.children('tr').length > 0) {
            let n = 0;
            let category = this.m_element.children('tr').first().attr('category');
            let rows = this.m_element.children('tr').toArray();
            for (let el of rows) {
                if ($(el).attr('category') != category) {
                    n = 1 - n;
                    category = $(el).attr('category');
                }
                $(el).removeClass('row_0').removeClass('row_1').addClass("row_" + n);
            }
            ;
        }
        // re-add the listeners
        this.addListeners();
        this.window_onResize();
    }
    displayList(transactions, total, balance) {
        // transactions = transactions.slice();
        // transactions.sort(this.sorter.bind(this));
        $(() => {
            // prevent races between the constructor and this method
            if (!this.m_element) {
                setTimeout(() => {
                    this.displayList(transactions);
                }, 100);
                return;
            }
            spinner_1.default.show();
            if (total) {
                this.setTotal(total);
            }
            if (balance) {
                this.setBalance(balance);
            }
            let promises = new Array();
            this.m_element.empty();
            for (let transaction of transactions) {
                promises.push(this.render(TEMPLATE, { item: transaction }).then((template) => {
                    let row = $(template);
                    this.m_element.append(row);
                }));
            }
            Promise.all(promises).then(() => {
                // setup the alternate row classes
                this.updateRows();
                // hide the spinner
                modalspinner_1.default.hide();
            });
        });
    }
    update(transaction, total, balance) {
        $(() => {
            if (total) {
                this.setTotal(total);
            }
            if (balance) {
                this.setBalance(balance);
            }
            this.m_element.children('#' + transaction.id).remove();
            // add this to the end of the list
            this.render(TEMPLATE, { item: transaction }).then((template) => {
                this.m_element.append($(template));
                this.updateRows();
            });
        });
    }
    clear() {
        this.m_element.empty();
    }
    addTransaction(date) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = {
                amount: 0,
                category: this.m_config.categories[0],
                date: date,
                name: "",
            };
            let names = yield this.LoadNames();
            // delete is not allowed since this is a new transaction
            let editor = new transactioneditor_1.default(transaction, this.SaveTransaction, () => { }, this.m_config.categories, names);
            editor.open();
        });
    }
    addRecurring(date) {
        return __awaiter(this, void 0, void 0, function* () {
            let start = date;
            let end = Date.parseFb(start).add("1 year").toFbString();
            let transaction = {
                amount: 0,
                category: this.m_config.categories[0],
                end: end,
                name: "",
                period: "1 month",
                start: start
            };
            let names = yield this.LoadNames();
            let editor = new recurringtransactioneditor_1.default(transaction, this.SaveRecurring, () => { }, this.m_config.categories, names);
            editor.open();
        });
    }
    listenToTransactions(transactions) {
        transactions.on('addedinperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            let total = yield transactions.getTotal();
            let balance = yield transactions.getBalance(total);
            this.update(transaction, total, balance);
        }));
        transactions.on('addedbeforeperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            let total = yield transactions.getTotal();
            let balance = yield transactions.getBalance(total);
            this.setTotal(total);
            this.setBalance(balance);
        }));
        transactions.on('changed', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            let total = yield transactions.getTotal();
            let balance = yield transactions.getBalance(total);
            if (transactions.Start <= transaction.date && transaction.date <= transactions.End) {
                this.update(transaction, total, balance);
            }
            else {
                this.m_element.children('#' + transaction.id).remove();
                this.setTotal(total);
                this.setBalance(balance);
            }
        }));
        transactions.on('removedinperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            let total = yield transactions.getTotal();
            let balance = yield transactions.getBalance(total);
            this.m_element.children('#' + transaction.id).remove();
            this.setTotal(total);
            this.setBalance(balance);
        }));
        transactions.on('removedbeforeperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            let total = yield transactions.getTotal();
            let balance = yield transactions.getBalance(total);
            this.m_element.children('#' + transaction.id).remove();
            this.setTotal(total);
            this.setBalance(balance);
        }));
        transactions.on('periodloaded', (transactionList, total, balance) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            this.displayList(transactionList, total, balance);
        }));
    }
    turnOffUpdates() {
        this.m_update = false;
    }
    turnOnUpdates() {
        this.m_update = true;
    }
}
exports.default = TransactionList;
