/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/jquerymobile/index.d.ts" />
/// <reference path="./ejs.d.ts" />

import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

import "./lib/date.ext"
import "./lib/number.ext"

import Budget from "./controllers/budget";

import Button from "./components/button";
import Select from "./components/select";
import Renderer from "./components/renderer";
import TransactionList from "./components/transactionlist";
import Previewer from "./components/previewer";
import Spinner from "./components/spinner";
import { RecordMap } from "./models/record";
import Transaction from "./models/transaction";
import SearchDialog from "./components/searchdialog";
import RecurringTransaction from "./models/recurringtransaction";

interface JQuery {
    panel(command?: string): JQuery;
}

class BudgetForm extends Renderer {
    private btnSearch : Button;
    private btnToday : Button;
    private btnPrev : Button;
    private periodMenu : Select;
    private btnNext : Button;
    private btnEditTransaction : Button;
    private btnAddTransaction: Button;
    private btnLogout : Button;
    private btnConfig : Button;
    private btnDownload : Button;
    private btnNewRecurring : Button;
    private btnReport : Button;
    private btnCash : Button;
    private btnTransfer : Button;

    private transactionList: TransactionList;
    private previewer : Previewer;
    private app: firebase.app.App;
    private budget: Budget;

    private periodStart : string;
    private periodEnd : string;

    constructor() {
        super();

        this.app = firebase.initializeApp({
            apiKey: "AIzaSyDhs0mPVlovk6JHnEdv6HeU2jy3M8VRoSk",
            authDomain: "budget-dacac.firebaseapp.com",
            databaseURL: "https://budget-dacac.firebaseio.com",
            storageBucket: "budget-dacac.appspot.com"
        });

        $(() => {
            this.btnSearch = new Button('#btnSearch').on('click', this.btnSearch_onClick.bind(this));
            this.btnToday = new Button('#btnToday').on('click', this.btnToday_onClick.bind(this));
            this.btnPrev = new Button('#btnPrev').on('click', this.btnPrev_onClick.bind(this));
            this.periodMenu = new Select('#periodMenu').on('change', this.periodMenu_onChange.bind(this));
            this.btnNext = new Button('#btnNext').on('click', this.btnNext_onClick.bind(this));
            this.btnEditTransaction = new Button('#btnEditTransaction').on('click', this.btnEditTransaction_onClick.bind(this));
            this.btnAddTransaction = new Button('#btnAddTransaction').on('click', this.btnAddTransaction_onClick.bind(this));
            this.btnLogout = new Button('#btnLogout').on('click', this.btnLogout_onClick.bind(this));
            this.btnConfig = new Button('#btnConfig').on('click', this.btnConfig_onClick.bind(this));
            this.btnDownload = new Button('#btnDownload').on('click', this.btnDownload_onClick.bind(this));
            this.btnNewRecurring = new Button('#btnNewRecurring').on('click', this.btnNewRecurring_onClick.bind(this));
            this.btnReport = new Button('#btnReport').on('click', this.btnReport_onClick.bind(this));
            this.btnCash = new Button('#btnCash').on('click', this.btnCash_onClick.bind(this));
            this.btnTransfer = new Button('#btnTransfer').on('click', this.btnTransfer_onClick.bind(this));

            firebase.auth().onAuthStateChanged(this.firebase_onAuthStateChanged.bind(this));
        });
    }

    private gotoPeriod(period: string | Date | Timespan) {
        if (typeof period == "string") {
            period = Date.parseFb(period);
        } else {
            period = period as Date;
        }

        let end = period.add(this.budget.Config.length).subtract("1 day") as Date;

        this.periodStart = period.toFbString();
        this.periodEnd = end.toFbString();
        this.periodMenu.val(this.periodStart);
        this.periodMenu.refresh();

        document.title = `${period.format("MMM d")} - ${end.format("MMM d")}`;

        this.budget.gotoDate(this.periodStart);
    }

    // UI Events
    btnSearch_onClick(e: JQueryEventObject) : void {
        $('#menu_panel').panel('close');

        let searchForm = new SearchDialog(this.budget.Transactions);
        searchForm.GotoPeriod = (date: string) => {
            searchForm.close();
            let { start } = this.budget.Config.calculatePeriod(date);
            this.gotoPeriod(start);
        }
        searchForm.open();
    }

    btnToday_onClick(e: JQueryEventObject) : void {
        e.preventDefault();
        let { start } = this.budget.Config.calculatePeriod(Date.today());
        this.gotoPeriod(start);
    }

    btnPrev_onClick(e: JQueryEventObject) : void {
        e.preventDefault();
        this.gotoPeriod(Date.parseFb(this.periodStart).subtract(this.budget.Config.length));
    }

    periodMenu_onChange(e: JQueryEventObject) : void {
        e.preventDefault();
        this.gotoPeriod(this.periodMenu.val().toString())
    }

    btnNext_onClick(e: JQueryEventObject) : void {
        e.preventDefault();
        this.gotoPeriod(Date.parseFb(this.periodStart).add(this.budget.Config.length));
    }

    btnEditTransaction_onClick(e: JQueryEventObject) : void {
        this.transactionList.editSelected();
    }

    btnAddTransaction_onClick(e: JQueryEventObject) : void {
        this.transactionList.addTransaction(this.periodStart);
    }

    btnLogout_onClick(e: JQueryEventObject) : void {
        e.preventDefault();
        $('#menu_panel').panel('close');
        console.log('logging out');
        this.logout();
    }

    btnConfig_onClick(e: JQueryEventObject) : void {}
    btnDownload_onClick(e: JQueryEventObject) : void {}
    btnNewRecurring_onClick(e: JQueryEventObject) : void {}
    btnReport_onClick(e: JQueryEventObject) : void {}
    btnCash_onClick(e: JQueryEventObject) : void {}
    btnTransfer_onClick(e: JQueryEventObject) : void {}

    // Configuration
    config_onRead() {
        this.periodMenu.empty();

        this.transactionList = new TransactionList('#tblTransactions', this.budget.Config);
        // wire up the load/save/delete functionality
        this.transactionList.LoadTransaction = (key: string) => { return this.budget.Transactions.load(key); }
        this.transactionList.SaveTransaction = (transaction: Transaction) => { return this.budget.Transactions.save(transaction); }
        this.transactionList.DeleteTransaction = async (key: string) => { return this.budget.Transactions.remove(key); }

        this.transactionList.LoadRecurring = (key: string) => { return this.budget.Recurrings.load(key); }
        this.transactionList.SaveRecurring = (transaction: RecurringTransaction) => { return this.budget.Recurrings.save(transaction); }
        this.transactionList.DeleteRecurring = (key: string) => { return this.budget.Recurrings.remove(key); }


        for (let date = Date.parseFb(this.budget.Config.start); date.le(Date.today().add('5 years')); date = date.add(this.budget.Config.length)) {
            let label = date.format("MMM d") + " - " + (date.add(this.budget.Config.length).subtract("1 day") as Date).format("MMM d, yyyy");
            this.periodMenu.append(date.toFbString(), label);
        }

        if (this.periodStart) {
            let { start, end } = this.budget.Config.calculatePeriod(this.periodStart);
            this.periodStart = start;
            this.periodEnd = end;
        } else {
            let { start, end } = this.budget.Config.calculatePeriod(Date.today());
            this.periodStart = start;
            this.periodEnd = end;
        }

        this.gotoPeriod(this.periodStart);
    }
    
    // Data Events
    async budget_onTransactionChanged(transaction: Transaction) { 
        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
                this.transactionList.update(transaction);
        } 
        
        if (this.periodEnd >= transaction.date) {
            let total = await this.budget.Transactions.getTotal();
            this.transactionList.setTotal(total);
        }
    }

    async budget_onPeriodLoaded(transactions: RecordMap<Transaction>) {
        let total = await this.budget.Transactions.getTotal();
        this.transactionList.displayList(this.budget.Transactions.List, total);
        Spinner.hide();
    }

    async budget_onTransactionAddedInPeriod(transaction: Transaction) {
        let total = await this.budget.Transactions.getTotal();
        this.transactionList.update(transaction, total);
    }

    async budget_onTransactionAddedBeforePeriod(transaction: Transaction) {
        let total = await this.budget.Transactions.getTotal();
        this.transactionList.setTotal(total);
    }

    async budget_onTransactionAdded(transaction: Transaction) {
        console.log("budget_onTransactionAdded");
        //TODO: Update chart
    }

    async budget_onTransactionRemovedInPeriod(transaction: Transaction) {
        let total = await this.budget.Transactions.getTotal();
        this.transactionList.displayList(this.budget.Transactions.List, total);
        Spinner.hide();
    }

    async budget_onTransactionRemovedBeforePeriod(transaction: Transaction) {
        let total = await this.budget.Transactions.getTotal();
        this.transactionList.update(transaction, total);
    }

    async budget_onTransactionRemoved(transaction: Transaction) {
        console.log("budget_onTransactionRemoved");
        //TODO: Update chart
    }

    // Authorization
    firebase_onAuthStateChanged(user: firebase.User) {
        $(() => {
            if (user === null) {
                this.budget = null
                Spinner.hide();
                if (this.transactionList) { this.transactionList.clear(); }
            } else {
                Spinner.show();
                this.budget = new Budget(firebase.database().ref(user.uid));
                this.budget.on('config_read', this.config_onRead.bind(this));
                this.budget.on('loadperiod', this.budget_onPeriodLoaded.bind(this));
                this.budget.on('transactionchanged', this.budget_onTransactionChanged.bind(this));
                this.budget.on('transactionaddedinperiod', this.budget_onTransactionAddedInPeriod.bind(this));
                this.budget.on('transactionaddedbeforeperiod', this.budget_onTransactionAddedBeforePeriod.bind(this));
                this.budget.on('transactionadded', this.budget_onTransactionAdded.bind(this));
                this.budget.on('transactionremovedinperiod', this.budget_onTransactionRemovedInPeriod.bind(this));
                this.budget.on('transactionremovedbeforeperiod', this.budget_onTransactionRemovedBeforePeriod.bind(this));
                this.budget.on('transactionremoved', this.budget_onTransactionRemoved.bind(this));
            }
        });
    }

    login(username: string, password: string) {
        $(() => {
            firebase.auth().signInWithEmailAndPassword(username, password);
        });
    }

    logout() {
        this.periodStart = null;
        $(() => { firebase.auth().signOut(); });
    }

}

let m_viewer = new BudgetForm();

Object.defineProperty(window, 'viewer', {
    get: () => {
        return m_viewer;
    }
})