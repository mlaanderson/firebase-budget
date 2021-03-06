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
const TEMPLATE = "info_v2";
function previewSorter(r1, r2) {
    var a1 = $(r1).children('.in_date').attr('value');
    var a2 = $(r2).children('.in_date').attr('value');
    if (a1 < a2)
        return -1;
    if (a1 > a2)
        return 1;
    return 0;
}
class Previewer extends renderer_1.default {
    constructor(element) {
        super();
        this.m_transaction = null;
        this.m_transactions = null;
        this.m_update = false;
        this.GotoTransaction = (date) => { console.log("GOTOTRANSACTION", date); };
        $(() => {
            this.m_element = $(element);
        });
    }
    handleItemClick(ev) {
        ev.preventDefault();
        let target = $(ev.target);
        if (target.is('tr') == false) {
            target = target.parents('tr').children('td.in_date');
        }
        this.GotoTransaction(target.attr('value'));
    }
    display(transactions) {
        let result = [];
        for (let id in transactions) {
            result.push(transactions[id]);
        }
        this.displayList(result);
    }
    displayList(transactions) {
        transactions = transactions.slice();
        transactions.sort((a, b) => {
            return Date.parseFb(a.date).getTime() - Date.parseFb(b.date).getTime();
        });
        let sum = transactions.map((tr) => tr.amount).reduce((p, c) => p + c, 0);
        let sumPaid = transactions.filter((tr) => tr.paid === true).map((tr) => tr.amount).reduce((p, c) => p + c, 0);
        this.render(TEMPLATE, { items: transactions, title: transactions.length > 0 ? transactions[0].name : "", sum: sum, sumPaid: sumPaid }).then((template) => {
            this.m_element.empty().append($(template));
            this.m_element.find('tr').on('click', this.handleItemClick.bind(this));
            this.m_element.find('tr').on('mouseover', (e) => {
                let target = $(e.target);
                if (target.is('tr') == false) {
                    target = target.parents('tr');
                }
                this.m_element.find('tr').css('background-color', '');
                target.css('background-color', '#eef');
            });
            this.m_element.find('tr').on('mouseout', () => {
                this.m_element.find('tr').css('background-color', '');
            });
        });
    }
    update(transaction) {
        if (transaction) {
            if (this.m_element.find(`tr[item=${transaction.id}]`).length > 0) {
                this.m_element.find(`tr[item=${transaction.id}] td.in_date`).text(Date.parseFb(transaction.date).format('MMM d, yyyy'));
                this.m_element.find(`tr[item=${transaction.id}] td.in_amount`).text(transaction.amount.toCurrency());
            }
            else {
                let row = $(`<tr id="info_${transaction.id}" item="${transaction.id}" name="${transaction.name}" category="${transaction.category}">
                    <td class="in_date" value="${transaction.date}">${Date.parseFb(transaction.date).format("MMM d, yyyy")}</td>
                    <td class="in_amount" value="${transaction.amount}">${transaction.amount.toCurrency()}</td>
                    </tr>`);
                row.on('click', this.handleItemClick.bind(this));
                row.on('mouseout', () => {
                    this.m_element.find('tr').css('background-color', '');
                });
                row.on('mouseover', () => {
                    this.m_element.find('tr').css('background-color', '');
                    row.css('background-color', '#eef');
                });
                this.m_element.find('tbody').append(row);
            }
        }
        let rows = this.m_element.find('tbody').first().children('tr').toArray();
        let total = 0;
        for (let row of rows) {
            total += parseFloat($(row).children('.in_amount').attr('value') || '0');
        }
        rows.sort(previewSorter);
        this.m_element.find('tbody').empty();
        this.m_element.find('tbody').append(rows);
        this.m_element.find('.info_total').text(`${total.toCurrency()}`);
    }
    clear() {
        this.m_element.empty();
        this.m_transaction = null;
    }
    loadFromTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            let list = yield this.m_transactions.getSame(this.m_transaction);
            this.displayList(list);
        });
    }
    setTransaction(transaction) {
        this.m_transaction = transaction;
        // if we have transactions - pull the list
        if (this.m_transactions) {
            this.loadFromTransaction();
        }
    }
    listenToTransactions(transactions) {
        this.m_transactions = transactions;
        // add the listeners
        this.m_transactions.on('added', (transaction) => {
            if (this.m_update == false)
                return;
            if (this.m_transaction && this.m_transaction.category == transaction.category && this.m_transaction.name == transaction.name) {
                this.update(transaction);
            }
        });
        this.m_transactions.on('changed', (transaction) => {
            if (this.m_update == false)
                return;
            if (this.m_transaction && this.m_transaction.category == transaction.category && this.m_transaction.name == transaction.name) {
                this.update(transaction);
            }
        });
        this.m_transactions.on('removed', (transaction) => {
            if (this.m_update == false)
                return;
            this.m_element.find(`#info_${transaction.id}`).remove();
            this.update();
        });
        // if we have a transaction, filter to it
        if (this.m_transaction && this.m_update) {
            this.loadFromTransaction();
        }
    }
    turnOffUpdates() {
        this.m_update = false;
    }
    turnOnUpdates() {
        this.m_update = true;
    }
}
exports.default = Previewer;
