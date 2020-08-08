/// <reference path="../ejs.d.ts" />
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />

import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";

import Renderer from "./renderer";
import TransactionViewer from "./transactionviewer"
import Config from "../controllers/config";
import Spinner from "./spinner";
import ModalSpinner from "./modalspinner";
import TransactionEditor from "./transactioneditor";
import RecurringTransactionEditor from "./recurringtransactioneditor";
import Transactions from "../controllers/transactions";

const TEMPLATE = "singletransaction";

export default class TransactionList extends Renderer implements TransactionViewer {
    private m_element: JQuery<HTMLElement>;
    private m_config: Config;
    private m_active_id: string;
    private m_tooltip: JQuery<HTMLElement>;
    private m_update: Boolean = true;
    
    SaveTransaction : (transaction: Transaction) => Promise<string> = async (transaction) => { console.log("SAVETRANSACTION", transaction); return null; };
    LoadTransaction : (id: string) => Promise<Transaction> = async (id) => { console.log("LOADTRANSACTION:", id); return null; }
    DeleteTransaction : (id: string) => Promise<string> = async (id) => { console.log("DELETETRANSACTION", id); return null; }
    PreviewTransaction : (id: string) => Promise<Array<Transaction>> = async (id) => { console.log("PREVIEWTRANSACTION", id); return null; }
    LoadNames: () => Promise<Array<string>> = async () => { console.log("LOADNAMES"); return []; }

    SaveRecurring: (transaction: RecurringTransaction) => Promise<string> = async (transaction) => { console.log("SAVERECURRING", transaction); return null; };
    LoadRecurring : (id: string) => Promise<RecurringTransaction> = async (id) => { console.log("LOADRECURRING:", id); return null; }
    DeleteRecurring : (id: string) => Promise<string> = async (id) => { console.log("DELETERECURRING", id); return null; }

    constructor(element: string | HTMLElement | JQuery<HTMLElement>, config: Config) {
        super();

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

    private sorter(a: { category: string, name: string, amount?: number }, b: { category: string, name: string, amount?: number }) : number {
        let idxA = this.m_config.categories.indexOf(a.category);
        let idxB = this.m_config.categories.indexOf(b.category);
        if (idxA != idxB) return idxA - idxB;

        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;

        if (a.amount && b.amount) {
            return b.amount - a.amount;
        }
        
        return 0;
    }

    private rowSorter(a: HTMLElement | JQuery<HTMLElement>, b: HTMLElement | JQuery<HTMLElement>) : number {
        return this.sorter({ category: $(a).attr('category'), name: $(a).attr('name'), amount: parseFloat($(a).attr('amount')) }, { category: $(b).attr('category'), name: $(b).attr('name'), amount: parseFloat($(b).attr('amount')) });
    }

    private getRow(e: JQuery.Event) : JQuery<HTMLElement> {
        return $(e.target).is('tr') ? $(e.target) : $(e.target).parents('tr').first();
    }

    private addListeners() {
        this.m_element.children('tr').off();
        this.m_element.find('span.recurring').off();
        this.m_element.find('[data-title]').off();
        this.m_element.find('[data-title]').children().off();

        this.m_element.children('tr').on('mouseover', this.onMouseOver.bind(this));
        this.m_element.children('tr').on('mouseout', this.onMouseOut.bind(this));
        this.m_element.children('tr').on('click', this.onClick.bind(this));
        this.m_element.children('tr').on('dblclick', this.onDoubleClick.bind(this));
        this.m_element.find('span.recurring').on('click',this.onRecurringClick.bind(this));

    }

    private findTitleElement(e: JQuery.Event) : JQuery<HTMLElement> {
        if ($(e.target).parent().jqmData('title')) return $(e.target).parent();
        return $(e.target); 
    }

    private onMouseOutTitle(e: JQuery.Event) {
        let target = this.findTitleElement(e);
        if (target.jqmData('title')) {
            target.data('titleShow', false);
            this.m_tooltip.css('display', 'none');
        }
    }

    private onMouseOverTitle(e: JQuery.Event) { console.log(e);
        let target = this.findTitleElement(e);
        if (target.jqmData('title')) {
            if (target.data('titleShow') !== true) {
                this.m_tooltip.text(target.jqmData('title'));
                this.m_tooltip.css({ 'display': '', 'top': (e.clientY - 20) + 'px', 'left': (e.clientX) + 'px' });
            }
            target.data('titleShow', true);
        }
    }

    private async editTransaction(id: string) {
        let transaction = await this.LoadTransaction(id);
        let names = await this.LoadNames();

        if (transaction != null) {
            let editor = new TransactionEditor(transaction, this.SaveTransaction, this.DeleteTransaction, this.m_config.categories, names);
            editor.open();
        }
    }

    private async editRecurring(id: string) {
        let transaction = await this.LoadRecurring(id);
        let names = await this.LoadNames();

        if (transaction != null) {
            let editor = new RecurringTransactionEditor(transaction, this.SaveRecurring, this.DeleteRecurring, this.m_config.categories, names);
            editor.open();
        }
    }

    private get totalElement() : JQuery<HTMLElement> {
        return $(this.m_element).parent().find('tfoot th#total_calc');
    }

    private get balanceElement() : JQuery<HTMLElement> {
        return $(this.m_element).parent().find('tfoot th#balance_calc');
    }

    private get rows() : JQuery<HTMLElement> {
        return this.m_element.children('tr');
    }

    // events
    onMouseOver(e: JQuery.Event) {
        this.rows.css('background-color', '');
        this.rows.children('td').css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
        this.getRow(e).children('td').css('background-color', '#eef');
    }

    onMouseOut() {
        this.rows.css('background-color', '');
        this.rows.children('td').css('background-color', '');
    }

    onDoubleClick(e: JQuery.Event) {
        e.preventDefault();
        let id = this.getRow(e).attr('id');
        this.editTransaction(id);
    }

    onClick(e: JQuery.Event) {
        e.preventDefault();
        this.m_active_id = this.getRow(e).css('background-color', '#eef').attr('id');
        this.getRow(e).children('td').css('background-color', '#eef');
        this.PreviewTransaction(this.m_active_id);
    }

    onRecurringClick(e: JQuery.Event) {
        e.preventDefault();
        let target = $(e.target);
        if (target.is('span.recurring') == false) {
            target = target.parents('span.recurring');
        }

        if (target.is('span.recurring') === false) return;
        let id = target.attr('recurring');
        this.editRecurring(id);
    }

    // methods
    setTotal(total: number) {
        $(() => {
            this.totalElement.text("Budget Balance: " + total.toCurrency());
        });
    }

    setBalance(balance: number) {
        $(() => {
            this.balanceElement.text("Bank Balance: " + balance.toCurrency());
        });
    }

    editSelected() {
        if (this.m_active_id) {
            this.editTransaction(this.m_active_id);
        }
    }

    display(transactions: RecordMap<Transaction>, total?: number, balance?: number) {
        let list: Array<Transaction> = [];
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
            };
        }

        // re-add the listeners
        this.addListeners();

        this.window_onResize();
    }

    displayList(transactions: Array<Transaction>, total?: number, balance?: number) {
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

            Spinner.show();

            if (total) {
                this.setTotal(total);
            }

            if (balance) {
                this.setBalance(balance);
            }

            let promises = new Array<Promise<void>>();

            this.m_element.empty();

            for (let transaction of transactions) {
                promises.push(this.render(TEMPLATE, { item: transaction }).then((template) => {
                    let row = $(template);
                    this.m_element.append(row);
                }));
            }

            Promise.all(promises).then(() => {
                // setup the alternate row classes
                this.updateRows()
                // hide the spinner
                ModalSpinner.hide();
            });
        });
    }

    update(transaction: Transaction, total?: number, balance?: number) {
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

    async addTransaction(date: string) {
        let transaction: Transaction = {
            amount: 0,
            category: this.m_config.categories[0],
            date: date,
            name: "",
        };

        let names = await this.LoadNames();

        // delete is not allowed since this is a new transaction
        let editor = new TransactionEditor(transaction, this.SaveTransaction, () => {}, this.m_config.categories, names);
        editor.open();
    }

    async addRecurring(date: string) {
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

        let names = await this.LoadNames();
        let editor = new RecurringTransactionEditor(transaction, this.SaveRecurring, () => {}, this.m_config.categories, names);
        editor.open();
    } 

    listenToTransactions(transactions: Transactions) {
        transactions.on('addedinperiod', async (transaction: Transaction) => {
            if (this.m_update == false) return;
            let total = await transactions.getTotal();
            let balance = await transactions.getBalance(total);
            this.update(transaction, total, balance);
        });

        transactions.on('addedbeforeperiod', async (transaction: Transaction) => {
            if (this.m_update == false) return;
            let total = await transactions.getTotal();
            let balance = await transactions.getBalance(total);
            this.setTotal(total);
            this.setBalance(balance);
        });

        transactions.on('changed', async (transaction: Transaction) => {
            if (this.m_update == false) return;
            let total = await transactions.getTotal();
            let balance = await transactions.getBalance(total);

            if (transactions.Start <= transaction.date && transaction.date <= transactions.End) {
                this.update(transaction, total, balance);
            } else {
                this.m_element.children('#' + transaction.id).remove();
                this.setTotal(total);
                this.setBalance(balance);
            }
        });

        transactions.on('removedinperiod', async (transaction: Transaction) => {
            if (this.m_update == false) return;
            let total = await transactions.getTotal();
            let balance = await transactions.getBalance(total);
            this.m_element.children('#' + transaction.id).remove();
            this.setTotal(total);
            this.setBalance(balance);
        });

        transactions.on('removedbeforeperiod', async (transaction: Transaction) => {
            if (this.m_update == false) return;
            let total = await transactions.getTotal();
            let balance = await transactions.getBalance(total);
            this.m_element.children('#' + transaction.id).remove();
            this.setTotal(total);
            this.setBalance(balance);
        });

        transactions.on('periodloaded', async (transactionList: Array<Transaction>, total: number, balance: number) => {
            if (this.m_update == false) return;
            this.displayList(transactionList, total, balance);
        });
    }

    turnOffUpdates() {
        this.m_update = false;
    }

    turnOnUpdates() {
        this.m_update = true;
    }
}