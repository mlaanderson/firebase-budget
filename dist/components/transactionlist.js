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
const transactioneditor_1 = require("./transactioneditor");
const TEMPLATE = "singletransaction";
class TransactionList extends renderer_1.default {
    constructor(element, config) {
        super();
        this.SaveTransaction = (transaction) => __awaiter(this, void 0, void 0, function* () { console.log("SAVETRANSACTION", transaction); return null; });
        this.LoadTransaction = (id) => __awaiter(this, void 0, void 0, function* () { console.log("LOADTRANSACTION:", id); return null; });
        this.DeleteTransaction = (id) => __awaiter(this, void 0, void 0, function* () { console.log("DELETETRANSACTION", id); return null; });
        this.SaveRecurring = (transaction) => __awaiter(this, void 0, void 0, function* () { console.log("SAVERECURRING", transaction); return null; });
        this.LoadRecurring = (id) => __awaiter(this, void 0, void 0, function* () { console.log("LOADRECURRING:", id); return null; });
        this.DeleteRecurring = (id) => __awaiter(this, void 0, void 0, function* () { console.log("DELETERECURRING", id); return null; });
        this.m_config = config;
        $(() => {
            this.m_element = $(element).children('tbody');
            $(window).on('resize', this.window_onResize);
        });
    }
    window_onResize() {
        $('#main').css('max-height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
        $('#main').css('height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
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
        return 0;
    }
    rowSorter(a, b) {
        return this.sorter({ category: $(a).attr('category'), name: $(a).attr('name') }, { category: $(b).attr('category'), name: $(b).attr('name') });
    }
    getRow(e) {
        return $(e.target).is('tr') ? $(e.target) : $(e.target).parents('tr').first();
    }
    addListeners() {
        this.m_element.children('tr').on('mouseover', this.onMouseOver.bind(this));
        this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
        this.m_element.children('tr').on('click', this.onClick.bind(this));
        this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
        this.m_element.find('span.recurring').on('click', this.onRecurringClick.bind(this));
    }
    editTransaction(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.LoadTransaction(id);
            if (transaction != null) {
                let editor = new transactioneditor_1.default(transaction, this.SaveTransaction, this.DeleteTransaction, this.m_config.categories);
                editor.open();
            }
        });
    }
    editRecurring(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.LoadRecurring(id);
            if (transaction != null) {
                console.log(`TODO: start recurring editor for ${id}`);
            }
        });
    }
    get totalElement() {
        return $(this.m_element).parent().find('tfoot th');
    }
    get rows() {
        return this.m_element.children('tr');
    }
    // events
    onMouseOver(e) {
        this.rows.css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
    }
    onMouseOut() {
        this.rows.css('background-color', '');
    }
    onDoubleClick(e) {
        e.preventDefault();
        let id = this.getRow(e).attr('id');
        this.editTransaction(id);
    }
    onClick(e) {
        e.preventDefault();
        this.m_active_id = this.getRow(e).css('background-color', '#eef').attr('id');
    }
    onRecurringClick(e) {
        e.preventDefault();
        let id = $(e.target).attr('recurring');
        this.editRecurring(id);
    }
    // methods
    setTotal(total) {
        $(() => {
            this.totalElement.text(total.toCurrency());
        });
    }
    editSelected() {
        if (this.m_active_id) {
            this.editTransaction(this.m_active_id);
        }
    }
    display(transactions, total) {
        let list = [];
        for (let id in transactions) {
            list.push(transactions[id]);
        }
        this.displayList(list, total);
    }
    displayList(transactions, total) {
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
            // transactions.sort(this.sorter.bind(this));
            let promises = new Array();
            this.m_element.empty();
            for (let transaction of transactions) {
                promises.push(this.render(TEMPLATE, { item: transaction }).then((template) => {
                    let row = $(template).data("transaction", transaction);
                    this.m_element.append(row);
                }));
            }
            Promise.all(promises).then(() => {
                // setup the alternate row classes
                let n = 0;
                let category = this.m_element.children('tr').first().data('transaction').category;
                let rows = this.m_element.children('tr').toArray();
                for (let el of rows) {
                    if ($(el).data('transaction').category != category) {
                        n = 1 - n;
                        category = $(el).data('transaction').category;
                    }
                    $(el).addClass("row_" + n);
                }
                ;
                // add the listeners
                this.m_element.children('tr').on('mouseover', this.onMouseOver.bind(this));
                this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
                this.m_element.children('tr').on('click', this.onClick.bind(this));
                this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
                this.m_element.find('.recurring').on('click', this.onRecurringClick.bind(this));
                this.window_onResize();
                // hide the spinner
                spinner_1.default.hide();
            });
        });
    }
    update(transaction, total) {
        $(() => {
            if (total) {
                this.setTotal(total);
            }
            this.m_element.children('#' + transaction.id).remove();
            // add this to the end of the list
            this.render(TEMPLATE, { item: transaction }).then((template) => {
                this.m_element.append($(template));
                // get the rows as an array
                let rows = this.rows.toArray();
                // empty the table
                this.m_element.empty();
                // sort the rows
                rows.sort(this.rowSorter.bind(this));
                // add the rows again
                this.m_element.append(rows);
                // re-add the listeners
                this.m_element.children('tr').off().on('mouseover', this.onMouseOver.bind(this));
                this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
                this.m_element.children('tr').on('click', this.onClick.bind(this));
                this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
                this.m_element.find('.recurring').off().on('click', this.onRecurringClick.bind(this));
                this.window_onResize();
            });
        });
    }
    clear() {
        this.m_element.empty();
    }
    addTransaction(date) {
        let transaction = {
            amount: 0,
            category: this.m_config.categories[0],
            date: date,
            name: "",
        };
        // delete is not allowed since this is a new transaction
        let editor = new transactioneditor_1.default(transaction, this.SaveTransaction, () => { }, this.m_config.categories);
        editor.open();
    }
}
exports.default = TransactionList;
