/// <reference path="../ejs.d.ts" />
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />

import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import Renderer from "./renderer";
import TransactionViewer from "./transactionviewer"
import Transactions from "../controllers/transactions";

const TEMPLATE = "info_v2";

function previewSorter(r1: HTMLElement, r2: HTMLElement) { 
    var a1 = $(r1).children('.in_date').attr('value');
    var a2 = $(r2).children('.in_date').attr('value');
    if (a1 < a2) return -1;
    if (a1 > a2) return 1;
    return 0;
}

export default class Previewer extends Renderer implements TransactionViewer {
    private m_element: JQuery<HTMLElement>;
    private m_transaction: Transaction = null;
    private m_transactions: Transactions = null;
    private m_update: boolean = false;

    GotoTransaction: (date: string) => void = (date) => { console.log("GOTOTRANSACTION", date); };
    
    constructor(element: JQuery<HTMLElement> | string) {
        super();
        $(() => {
            this.m_element = $(element);
        });
    }

    private handleItemClick(ev: JQuery.Event<HTMLElement>) {
        ev.preventDefault();
        
        let target = $(ev.target);
        if (target.is('tr') == false) {
            target = target.parents('tr').children('td.in_date');
        }

        this.GotoTransaction(target.attr('value'));
    }

    display(transactions: RecordMap<Transaction>) {
        let result: Array<Transaction> = [];
        for (let id in transactions) {
            result.push(transactions[id]);
        }
        this.displayList(result);
    }

    displayList(transactions: Array<Transaction>) {
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

    update(transaction?: Transaction) {
        if (transaction) {
            if (this.m_element.find(`tr[item=${transaction.id}]`).length > 0) {
                this.m_element.find(`tr[item=${transaction.id}] td.in_date`).text(Date.parseFb(transaction.date).format('MMM d, yyyy'));
                this.m_element.find(`tr[item=${transaction.id}] td.in_amount`).text(transaction.amount.toCurrency());
            } else {
                let row = $(`<tr id="info_${ transaction.id }" item="${ transaction.id }" name="${ transaction.name }" category="${ transaction.category }">
                    <td class="in_date" value="${ transaction.date }">${ Date.parseFb(transaction.date).format("MMM d, yyyy") }</td>
                    <td class="in_amount" value="${ transaction.amount }">${ transaction.amount.toCurrency() }</td>
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

        this.m_element.find('.info_total').text(`${ total.toCurrency() }`);
    }

    clear() {
        this.m_element.empty();
        this.m_transaction = null;
    }

    private async loadFromTransaction() {
        let list = await this.m_transactions.getSame(this.m_transaction);
        this.displayList(list);
    }

    setTransaction(transaction: Transaction) {
        this.m_transaction = transaction;

        // if we have transactions - pull the list
        if (this.m_transactions) {
            this.loadFromTransaction();
        }
    }

    listenToTransactions(transactions: Transactions) {
        this.m_transactions = transactions;

        // add the listeners
        this.m_transactions.on('added', (transaction : Transaction) => {
            if (this.m_update == false) return;
            if (this.m_transaction && this.m_transaction.category == transaction.category && this.m_transaction.name == transaction.name) {
                this.update(transaction);
            }
        });

        this.m_transactions.on('changed', (transaction : Transaction) => {
            if (this.m_update == false) return;
            if (this.m_transaction && this.m_transaction.category == transaction.category && this.m_transaction.name == transaction.name) {
                this.update(transaction);
            }
        });

        this.m_transactions.on('removed', (transaction : Transaction) => {
            if (this.m_update == false) return;
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