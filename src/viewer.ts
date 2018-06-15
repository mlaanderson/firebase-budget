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
import Panel from "./components/panel";
import CashDialog from "./components/cashdialog";
import TransferDialog from "./components/transferdialog";
import ConfigDialog from "./components/configdialog";
import LoginDialog from "./components/logindialog";
import HistoryChart from "./components/historychart";
import CanvasReport from "./components/canvasreport";
import PeriodReport from "./components/periodreport";
import YtdReport from "./components/ytdreport";
import ForgotPasswordDialog from "./components/forgotpassworddialog";
import MessageBox, { MessageBoxButtons, MessageBoxIcon } from "./components/messagebox";
import SignUpDialog from "./components/signupdialog";

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
    private btnDownloadAsCsv : Button;
    private btnNewRecurring : Button;
    private btnReport : Button;
    private btnYtdReport : Button;
    private btnCash : Button;
    private btnTransfer : Button;
    private pnlMenu: Panel;

    private transactionList: TransactionList;
    private previewer : Previewer;
    private chart : HistoryChart;
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
            this.btnDownloadAsCsv = new Button('#btnDownloadAsCsv').on('click', this.btnDownloadAsCsv_onClick.bind(this));
            this.btnNewRecurring = new Button('#btnNewRecurring').on('click', this.btnNewRecurring_onClick.bind(this));
            this.btnReport = new Button('#btnReport').on('click', this.btnReport_onClick.bind(this));
            this.btnYtdReport = new Button('#btnYtdReport').on('click', this.btnYtdReport_onClick.bind(this));
            this.btnCash = new Button('#btnCash').on('click', this.btnCash_onClick.bind(this));
            this.btnTransfer = new Button('#btnTransfer').on('click', this.btnTransfer_onClick.bind(this));
            this.pnlMenu = new Panel('#menu_panel');
            this.previewer = new Previewer('.info_div');

            this.chart = new HistoryChart('chart_div');
            
            this.previewer.GotoTransaction = this.gotoDate.bind(this);

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

    private gotoDate(date: string | Date) {
        let { start } = this.budget.Config.calculatePeriod(date);
        this.gotoPeriod(start);
    }

    private download(data: any, filename: string, type: string) {
        let blob = new Blob([data], { type: type });

        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            let elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            elem.style.display = 'none';
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }

    // UI Events
    btnSearch_onClick(e: JQuery.Event) : void {
        this.pnlMenu.close();

        let searchForm = new SearchDialog(this.budget.Transactions);
        searchForm.GotoPeriod = (date: string) => {
            searchForm.close();
            this.gotoDate(date);
        }
        searchForm.open();
    }

    btnToday_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        let { start } = this.budget.Config.calculatePeriod(Date.today());
        this.gotoPeriod(start);
    }

    btnPrev_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        this.gotoPeriod(Date.parseFb(this.periodStart).subtract(this.budget.Config.length));
    }

    periodMenu_onChange(e: JQuery.Event) : void {
        e.preventDefault();
        this.gotoPeriod(this.periodMenu.val().toString())
    }

    btnNext_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        this.gotoPeriod(Date.parseFb(this.periodStart).add(this.budget.Config.length));
    }

    btnEditTransaction_onClick(e: JQuery.Event) : void {
        this.transactionList.editSelected();
    }

    btnAddTransaction_onClick(e: JQuery.Event) : void {
        this.transactionList.addTransaction(this.periodStart);
    }

    btnLogout_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        this.pnlMenu.close();
        console.log('logging out');
        this.logout();
    }

    btnNewRecurring_onClick(e: JQuery.Event) : void {
        this.transactionList.addRecurring(this.periodStart);
    }

    btnConfig_onClick(e: JQuery.Event) : void {
        this.pnlMenu.close();
        let configDialog = new ConfigDialog(this.budget.Config, () => {
            this.budget.Config.write();
        });
        configDialog.open();
    }

    btnReport_onClick(e: JQuery.Event) : void {
        this.pnlMenu.close();
        let dialog = new PeriodReport();
        dialog.listenToTransactions(this.budget.Transactions);
        dialog.open();
    }

    btnYtdReport_onClick(e: JQuery.Event) : void {
        this.pnlMenu.close();
        let dialog = new YtdReport();
        dialog.listenToTransactions(this.budget.Transactions);
        dialog.open();
    }

    async btnDownloadAsCsv_onClick(e: JQuery.Event) {
        let data = await this.budget.Transactions.getCsv();
        let filename = `budget-${Date.today().toFbString()}.csv`

        this.download(data, filename, 'text/csv');

        this.pnlMenu.close();

    }

    async btnDownload_onClick(e: JQuery.Event) {
        let backup = await this.budget.getBackup();
        let stringData = JSON.stringify(backup);
        let filename = 'budget-' + Date.today().toFbString() + '.json';

        this.download(stringData, filename, 'application/json');

        this.pnlMenu.close();
    }

    btnCash_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        this.pnlMenu.close();

        let cashDialog = new CashDialog(this.budget.Transactions.Cash);
        cashDialog.open();
    }

    btnTransfer_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        this.pnlMenu.close();

        let transferDialog = new TransferDialog(this.budget.Transactions.Transfer);
        transferDialog.open();
    }

    async transactionList_PreviewTransaction(id: string) : Promise<Array<Transaction>> {
        let transaction = await this.budget.Transactions.load(id);
        let previewTransactions = await this.budget.Transactions.getSame(transaction);

        if (previewTransactions != null) {
            this.previewer.displayList(previewTransactions);
        }

        return previewTransactions || [];
    }

    // Configuration
    config_onRead() {
        this.periodMenu.empty();

        this.transactionList = new TransactionList('#tblTransactions', this.budget.Config);
        // wire up the load/save/delete functionality
        this.transactionList.LoadTransaction = (key: string) => { return this.budget.Transactions.load(key); }
        this.transactionList.SaveTransaction = (transaction: Transaction) => { return this.budget.Transactions.save(transaction); }
        this.transactionList.DeleteTransaction = async (key: string) => { return this.budget.Transactions.remove(key); }

        this.transactionList.LoadRecurring = (key: string) => { return this.budget.Recurrings.load(key); }
        this.transactionList.SaveRecurring = (transaction: RecurringTransaction) => { console.log("saving", transaction); return this.budget.Recurrings.save(transaction); }
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

        this.transactionList.PreviewTransaction = (id: string) => {
            return this.transactionList_PreviewTransaction(id);
        }
        this.gotoPeriod(this.periodStart);
    }

    // Authorization
    firebase_onAuthStateChanged(user: firebase.User) {
        $(() => {
            if (user === null) {
                this.budget = null
                Spinner.hide();
                if (this.transactionList) { this.transactionList.clear(); }
                
                // show the login dialog
                this.pnlMenu.close();
                let loginDialog = new LoginDialog(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
                loginDialog.open();
            } else {
                Spinner.show();
                this.budget = new Budget(firebase.database().ref(user.uid));

                this.budget.on('config_read', this.config_onRead.bind(this));

                this.budget.ready().then(() => {
                    this.previewer.listenToTransactions(this.budget.Transactions);
                    this.transactionList.listenToTransactions(this.budget.Transactions);
                    this.chart.listenToTransactions(this.budget.Transactions);
                    this.gotoDate(Date.today());
                });
            }
        });
    }

    async sendResetEmail(username: string) { 
        firebase.auth().sendPasswordResetEmail(username, {
            url: `${location.origin}?email=${encodeURIComponent(username)}`
        });
        Spinner.hide();
        await MessageBox.show("The password reset has been sent. Check your inbox for instructions.", "Reset Email Sent", MessageBoxButtons.OK, MessageBoxIcon.Information);
        let loginDialog = new LoginDialog(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
        loginDialog.open();
    }

    async registerAccount(username: string, password: string) {
        await firebase.auth().createUserWithEmailAndPassword(username, password);
        await MessageBox.show(`Thank you for signing up ${username}. Please login now.`, "Welcome", MessageBoxButtons.OK, MessageBoxIcon.Information);
        let dialog = new LoginDialog(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
        dialog.open();
    }

    signup() {
        $(() => {
            console.log("creating signup dialog");
            let dialog = new SignUpDialog(this.registerAccount.bind(this));
            dialog.open();
        });
    }

    resetPassword(username: string) { 
        $(() => {
            let dialog = new ForgotPasswordDialog(this.sendResetEmail.bind(this), username);
            dialog.open();
        })
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

Object.defineProperty(window, "MessageBox", {
    get: () => {
        return MessageBox;
    }
})