import * as $ from "jquery";
import "../ejs";

import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";

import Renderer from "./renderer";
import TransactionViewer from "./transactionviewer"
import Config from "../controllers/config";
import Spinner from "./spinner";

const TEMPLATE = "singletransaction";

export default class TransactionList extends Renderer implements TransactionViewer {
    private m_element: JQuery<HTMLElement>;
    private m_config: Config;
    private m_active_id: string;
    
    SaveTransaction : (transaction: Transaction) => void = () => {};
    SaveRecurring: (transaction: RecurringTransaction) => void = () => {};
    LoadTransaction : (id: string) => Promise<Transaction> = async () => { return null; }
    LoadRecurring : (id: string) => Promise<RecurringTransaction> = async () => { return null; }

    constructor(element: string | HTMLElement | JQuery<HTMLElement>, config: Config) {
        super();

        this.m_config = config;

        $(() => {
            this.m_element = $(element);
        });
    }

    private sorter(a: { category: string, name: string }, b: { category: string, name: string }) : number {
        let idxA = this.m_config.categories.indexOf(a.category);
        let idxB = this.m_config.categories.indexOf(b.category);
        if (idxA != idxB) return idxA - idxB;

        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    }

    private rowSorter(a: HTMLElement | JQuery<HTMLElement>, b: HTMLElement | JQuery<HTMLElement>) : number {
        return this.sorter({ category: $(a).attr('category'), name: $(a).attr('name') }, { category: $(b).attr('category'), name: $(b).attr('name') });
    }

    private getRow(e: JQuery.Event) : JQuery<HTMLElement> {
        return $(e.target).is('tr') ? $(e.target) : $(e.target).parents('tr').first();
    }

    private addListeners() {
        this.m_element.children('tr').on('mouseover', this.onMouseOver.bind(this));
        this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
        this.m_element.children('tr').on('click', this.onClick.bind(this));
        this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
        this.m_element.find('span.recurring').on('click',this.onRecurringClick.bind(this));
    }

    private async editTransaction(id: string) {
        let transaction = await this.LoadTransaction(id);

        if (transaction != null) {
            console.log(`TODO: start editor for ${id}`);
        }
    }

    private async editRecurring(id: string) {
        let transaction = await this.LoadRecurring(id);

        if (transaction != null) {
            console.log(`TODO: start recurring editor for ${id}`);
        }
    }

    private get totalElement() : JQuery<HTMLElement> {
        return $(this.m_element).parent().find('tfoot th');
    }

    private get rows() : JQuery<HTMLElement> {
        return this.m_element.children('tr');
    }

    // events
    onMouseOver(e: JQuery.Event) {
        this.rows.css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
    }

    onMouseOut() {
        this.rows.css('background-color', '');
    }

    onDoubleClick(e: JQuery.Event) {
        let id = this.getRow(e).attr('id');
        this.editTransaction(id);
    }

    onClick(e: JQuery.Event) {
        this.m_active_id = this.getRow(e).css('background-color', '#eef').attr('id');
    }

    onRecurringClick(e: JQuery.Event) {
        let id = $(e.target).attr('recurring');
        this.editRecurring(id);
    }

    // methods
    display(transactions: RecordMap<Transaction>, total?: number) {
        let list: Array<Transaction> = [];
        for (let id in transactions) {
            list.push(transactions[id]);
        }
        this.displayList(list, total);
    }

    displayList(transactions: Array<Transaction>, total?: number) {
        $(() => {
            // prevent races between the constructor and this method
            if (!this.m_element) {
                setTimeout(() => {
                    this.displayList(transactions);
                }, 100);
                return;
            }

            Spinner.show();

            if (total) {
                this.totalElement.text(total.toCurrency());
            }

            transactions.sort(this.sorter.bind(this));

            let promises = new Array<Promise<void>>();

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
                Spinner.hide();
            });
        });
    }

    update(transaction: Transaction, total?: number) {
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