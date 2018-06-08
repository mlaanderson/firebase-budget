import * as $ from "jquery";
import "../ejs";
import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import Renderer from "./renderer";
import TransactionViewer from "./transactionviewer"

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

    GotoTransaction: (id: string) => void = () => {};
    
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
            target = target.parents('tr');
        }

        this.GotoTransaction(target.attr('item'));
    }

    display(transactions: RecordMap<Transaction>) {
        let result: Array<Transaction> = [];
        for (let id in transactions) {
            result.push(transactions[id]);
        }
        this.displayList(result);
    }

    displayList(transactions: Array<Transaction>) {
        this.render(TEMPLATE, transactions).then((template) => {
            this.m_element.empty().append($(template));
            this.m_element.find('tr').on('click', this.handleItemClick.bind(this));
        });
    }

    update(transaction: Transaction, total: number) {
        if (this.m_element.find(`tr[item=${transaction.id}]`).length > 0) {
            this.m_element.find(`tr[item=${transaction.id}] td.in_date`).text(Date.parseFb(transaction.date).format('MMM d, yyyy'));
            this.m_element.find(`tr[item=${transaction.id}] td.in_amount`).text(transaction.amount.toCurrency());
        } else {
            let row = $(`<tr id="info_${transaction.id}" item="${transaction.id}">
                <td class="in_date">${ Date.parseFb(transaction.date).format("MMM d, yyyy") }</td>
                <td class="in_amount">${ transaction.amount.toCurrency() }</td>
                </tr>`);
            
            row.on('click', this.handleItemClick.bind(this));
        }
        this.m_element.find('em').text(`${transaction.name} - ${transaction.amount.toCurrency() }`);

        let rows = this.m_element.find('tbody tr').toArray();
        rows.sort(previewSorter);
        this.m_element.find('tbody').empty().append(rows);
    }
}