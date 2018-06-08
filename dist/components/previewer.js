"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("jquery");
require("../ejs");
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
        this.GotoTransaction = () => { };
        $(() => {
            this.m_element = $(element);
        });
    }
    handleItemClick(ev) {
        ev.preventDefault();
        let target = $(ev.target);
        if (target.is('tr') == false) {
            target = target.parents('tr');
        }
        this.GotoTransaction(target.attr('item'));
    }
    display(transactions) {
        let result = [];
        for (let id in transactions) {
            result.push(transactions[id]);
        }
        this.displayList(result);
    }
    displayList(transactions) {
        this.render(TEMPLATE, transactions).then((template) => {
            this.m_element.empty().append($(template));
            this.m_element.find('tr').on('click', this.handleItemClick.bind(this));
        });
    }
    update(transaction, total) {
        if (this.m_element.find(`tr[item=${transaction.id}]`).length > 0) {
            this.m_element.find(`tr[item=${transaction.id}] td.in_date`).text(Date.parseFb(transaction.date).format('MMM d, yyyy'));
            this.m_element.find(`tr[item=${transaction.id}] td.in_amount`).text(transaction.amount.toCurrency());
        }
        else {
            let row = $(`<tr id="info_${transaction.id}" item="${transaction.id}">
                <td class="in_date">${Date.parseFb(transaction.date).format("MMM d, yyyy")}</td>
                <td class="in_amount">${transaction.amount.toCurrency()}</td>
                </tr>`);
            row.on('click', this.handleItemClick.bind(this));
        }
        this.m_element.find('em').text(`${transaction.name} - ${transaction.amount.toCurrency()}`);
        let rows = this.m_element.find('tbody tr').toArray();
        rows.sort(previewSorter);
        this.m_element.find('tbody').empty().append(rows);
    }
}
exports.default = Previewer;
