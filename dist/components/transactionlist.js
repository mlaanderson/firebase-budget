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
const $ = require("jquery");
require("../ejs");
const renderer_1 = require("./renderer");
const spinner_1 = require("./spinner");
const TEMPLATE = "singletransaction";
class TransactionList extends renderer_1.default {
    constructor(element, config) {
        super();
        this.SaveTransaction = () => { };
        this.SaveRecurring = () => { };
        this.LoadTransaction = () => __awaiter(this, void 0, void 0, function* () { return null; });
        this.LoadRecurring = () => __awaiter(this, void 0, void 0, function* () { return null; });
        this.m_config = config;
        $(() => {
            this.m_element = $(element);
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
                console.log(`TODO: start editor for ${id}`);
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
        let id = this.getRow(e).attr('id');
        this.editTransaction(id);
    }
    onClick(e) {
        this.m_active_id = this.getRow(e).css('background-color', '#eef').attr('id');
    }
    onRecurringClick(e) {
        let id = $(e.target).attr('recurring');
        this.editRecurring(id);
    }
    // methods
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
                this.totalElement.text(total.toCurrency());
            }
            transactions.sort(this.sorter.bind(this));
            let promises = new Array();
            this.m_element.empty();
            for (let transaction of transactions) {
                promises.push(this.render(TEMPLATE, { item: transaction }).then((template) => {
                    this.m_element.append($(template));
                }));
            }
            Promise.all(promises).then(() => {
                // setup the alternate row classes
                // add the listeners
                // hide the spinner
                spinner_1.default.hide();
            });
        });
    }
    update(transaction, total) {
        $(() => {
            if (total) {
                this.totalElement.text(total.toCurrency());
            }
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
            });
        });
    }
}
exports.default = TransactionList;
