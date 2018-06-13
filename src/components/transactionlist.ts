/// <reference path="../ejs.d.ts" />
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />

import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";

import Renderer from "./renderer";
import TransactionViewer from "./transactionviewer"
import Config from "../controllers/config";
import Spinner from "./spinner";
import TransactionEditor from "./transactioneditor";
import RecurringTransactionEditor from "./recurringtransactioneditor";
import Transactions from "../controllers/transactions";
import Budget from "../controllers/budget";
import { async } from "@firebase/util";

const TEMPLATE = "singletransaction";

export default class TransactionList extends Renderer implements TransactionViewer {
    private m_element: JQuery<HTMLElement>;
    private m_config: Config;
    private m_active_id: string;
    
    SaveTransaction : (transaction: Transaction) => Promise<string> = async (transaction) => { console.log("SAVETRANSACTION", transaction); return null; };
    LoadTransaction : (id: string) => Promise<Transaction> = async (id) => { console.log("LOADTRANSACTION:", id); return null; }
    DeleteTransaction : (id: string) => Promise<string> = async (id) => { console.log("DELETETRANSACTION", id); return null; }
    PreviewTransaction : (id: string) => Promise<Array<Transaction>> = async (id) => { console.log("PREVIEWTRANSACTION", id); return null; }

    SaveRecurring: (transaction: RecurringTransaction) => Promise<string> = async (transaction) => { console.log("SAVERECURRING", transaction); return null; };
    LoadRecurring : (id: string) => Promise<RecurringTransaction> = async (id) => { console.log("LOADRECURRING:", id); return null; }
    DeleteRecurring : (id: string) => Promise<string> = async (id) => { console.log("DELETERECURRING", id); return null; }

    constructor(element: string | HTMLElement | JQuery<HTMLElement>, config: Config) {
        super();

        this.m_config = config;

        $(() => {
            this.m_element = $(element).children('tbody');
            $(window).on('resize', this.window_onResize);
        });
    }

    private window_onResize() {
        $('#main').css('max-height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
        $('#main').css('height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
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
            let editor = new TransactionEditor(transaction, this.SaveTransaction, this.DeleteTransaction, this.m_config.categories);
            editor.open();
        }
    }

    private async editRecurring(id: string) {
        let transaction = await this.LoadRecurring(id);

        if (transaction != null) {
            let editor = new RecurringTransactionEditor(transaction, this.SaveRecurring, this.DeleteRecurring, this.m_config.categories);
            editor.open();
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
        e.preventDefault();
        let id = this.getRow(e).attr('id');
        this.editTransaction(id);
    }

    onClick(e: JQuery.Event) {
        e.preventDefault();
        this.m_active_id = this.getRow(e).css('background-color', '#eef').attr('id');
        this.PreviewTransaction(this.m_active_id);
    }

    onRecurringClick(e: JQuery.Event) {
        e.preventDefault();
        let id = $(e.target).attr('recurring');
        this.editRecurring(id);
    }

    // methods
    setTotal(total: number) {
        $(() => {
            this.totalElement.text(total.toCurrency());
        });
    }

    editSelected() {
        if (this.m_active_id) {
            this.editTransaction(this.m_active_id);
        }
    }

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
                this.setTotal(total);
            }

            let promises = new Array<Promise<void>>();

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
                let category = (this.m_element.children('tr').first().data('transaction') as Transaction).category
                let rows = this.m_element.children('tr').toArray();

                for (let el of rows) {
                    if (($(el).data('transaction') as Transaction).category != category) {
                        n = 1 - n;
                        category = ($(el).data('transaction') as Transaction).category;
                    }
                    $(el).addClass("row_" + n);
                };

                // add the listeners
                this.m_element.children('tr').on('mouseover', this.onMouseOver.bind(this));
                this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
                this.m_element.children('tr').on('click', this.onClick.bind(this));
                this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
                this.m_element.find('.recurring').on('click', this.onRecurringClick.bind(this));

                this.window_onResize();
                // hide the spinner
                Spinner.hide();
            });
        });
    }

    update(transaction: Transaction, total?: number) {
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

    addTransaction(date: string) {
        let transaction: Transaction = {
            amount: 0,
            category: this.m_config.categories[0],
            date: date,
            name: "",
        };

        // delete is not allowed since this is a new transaction
        let editor = new TransactionEditor(transaction, this.SaveTransaction, () => {}, this.m_config.categories);
        editor.open();
    }

    addRecurring(date: string) {
        let start = date;
        let end = Date.parseFb(start).add("1 year").toFbString();

        let transaction: RecurringTransaction = {
            amount: 0,
            category: this.m_config.categories[0],
            end: end,
            name: "",
            period: "1 month",
            start: start    
        }

        let editor = new RecurringTransactionEditor(transaction, this.SaveRecurring, () => {}, this.m_config.categories);
        editor.open();
    } 

    listenToTransactions(transactions: Transactions) {
        transactions.on('addedinperiod', async (transaction: Transaction) => {
            let total = await transactions.getTotal();
            this.update(transaction, total);
        });

        transactions.on('addedbeforeperiod', async (transaction: Transaction) => {
            let total = await transactions.getTotal();
            this.setTotal(total);
        });

        transactions.on('changed', async (transaction: Transaction) => {
            let total = await transactions.getTotal();
            if (transactions.Start <= transaction.date && transaction.date <= transactions.End) {
                this.update(transaction, total);
            } else {
                this.m_element.children('#' + transaction.id).remove();
                this.setTotal(total);
            }
        });

        transactions.on('removedinperiod', async (transaction: Transaction) => {
            let total = await transactions.getTotal();
            this.m_element.children('#' + transaction.id).remove();
            this.setTotal(total);
        });

        transactions.on('removedbeforeperiod', async (transaction: Transaction) => {
            let total = await transactions.getTotal();
            this.m_element.children('#' + transaction.id).remove();
            this.setTotal(total);
        });

        transactions.on('periodloaded', async (transactionList: Array<Transaction>, total: number) => {
            this.displayList(transactionList, total);
        });
    }
}