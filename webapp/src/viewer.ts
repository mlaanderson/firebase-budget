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
import ModalSpinner from "./components/modalspinner";
import Transaction from "./models/transaction";
import SearchDialog from "./components/searchdialog";
import RecurringTransaction from "./models/recurringtransaction";
import Panel from "./components/panel";
import ConfigDialog from "./components/configdialog";
import LoginDialog from "./components/logindialog";
import HistoryChart from "./components/historychart";
import PeriodReport from "./components/periodreport";
import YtdReport from "./components/ytdreport";
import ForgotPasswordDialog from "./components/forgotpassworddialog";
import MessageBox, { MessageBoxButtons, MessageBoxIcon } from "./components/messagebox";
import SignUpDialog from "./components/signupdialog";
import { ConfigurationData } from "./controllers/config";

import ShowIntroWizard from "./introwizard";
import showEmergencyFundWizard from "./emergencyfundwizard";
import SetupDialog from "./components/setupwizard";

declare global {
    interface Window {
        setup: typeof SetupDialog;
        MessageBox: typeof MessageBox;
    }
}

window.setup = SetupDialog;
window.MessageBox = MessageBox;

export default class BudgetForm extends Renderer {
    private btnSearch : Button;
    private btnUndo: Button;
    private btnRedo: Button;
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
    private btnDowloadPeriodAsCsv : Button;
    private btnNewRecurring : Button;
    private btnReport : Button;
    private btnYtdReport : Button;
    private btnCash : Button;
    private btnTransfer : Button;
    private btnWizardEmergencyFund: Button;
    private pnlMenu: Panel;

    private transactionList: TransactionList;
    private previewer : Previewer;
    private chart : HistoryChart;
    private app: firebase.app.App;

    private periodStart : string;
    private periodEnd : string;

    budget: Budget;

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
            this.btnDowloadPeriodAsCsv = new Button('#btnDowloadPeriodAsCsv').on('click', this.btnDowloadPeriodAsCsv_onClick.bind(this));
            this.btnNewRecurring = new Button('#btnNewRecurring').on('click', this.btnNewRecurring_onClick.bind(this));
            this.btnReport = new Button('#btnReport').on('click', this.btnReport_onClick.bind(this));
            this.btnYtdReport = new Button('#btnYtdReport').on('click', this.btnYtdReport_onClick.bind(this));
            this.btnCash = new Button('#btnCash').on('click', this.btnCash_onClick.bind(this));
            this.btnTransfer = new Button('#btnTransfer').on('click', this.btnTransfer_onClick.bind(this));
            this.btnUndo = new Button('#btnUndo').on('click', this.btnUndo_onClick.bind(this));
            this.btnRedo = new Button('#btnRedo').on('click', this.btnRedo_onClick.bind(this));
            this.pnlMenu = new Panel('#menu_panel');
            this.previewer = new Previewer('.info_div');

            this.btnWizardEmergencyFund = new Button("#btnWizardEmergencyFund").on('click', this.btnWizardEmergencyFund_Click.bind(this));

            this.btnUndo.disabled = true;
            this.btnRedo.disabled = true;

            this.chart = new HistoryChart('chart_div');
            
            this.previewer.GotoTransaction = (date: Date | string) => {
                this.budget.gotoDate(date);
            };

            firebase.auth().onAuthStateChanged(this.firebase_onAuthStateChanged.bind(this));

            $(window).on('resize', () => {
                if ('ontouchstart' in document.documentElement == false) {
                    $('#btnEditTransaction').hide();
                } else {
                    $('#btnEditTransaction').show();
                }
            });
            if ('ontouchstart' in document.documentElement == false) {
                $('#btnEditTransaction').hide();
            } else {
                $('#btnEditTransaction').show();
            }

        });

        // try to bind the ctrl/command keys
        $(document).on('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'f':
                    case 'F':
                        e.preventDefault();
                        this.btnSearch.click();
                    break;
                    case 'z':
                    case 'Z':
                        e.preventDefault();
                        this.btnUndo.click();
                    break;
                    case 'y':
                    case 'Y':
                        e.preventDefault();
                        this.btnRedo.click();
                    break;
                }
            }
        });
    }

    private async periodLoaded() {
        this.periodStart = this.budget.Start;
        this.periodEnd = this.budget.End;
        this.periodMenu.val(this.periodStart);
        this.periodMenu.refresh();

        if (this.periodStart <= this.budget.Config.start) {
            this.btnPrev.disabled = true;
        } else {
            this.btnPrev.disabled = false;
        }

        $('[data-role=header] h1').text(`${Date.parseFb(this.periodStart).format("MMM d")} - ${Date.parseFb(this.periodEnd).format("MMM d")}`);
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

    // Wizards
    btnWizardEmergencyFund_Click(e: JQuery.Event) {
        e.preventDefault();
        this.pnlMenu.close();
        showEmergencyFundWizard(this);
    }

    // UI Events
    async btnUndo_onClick(e: JQuery.Event) {
        if (!this.budget) return;
        if (!this.budget.CanUndo) return;
        Spinner.show();
        await this.budget.Undo();
        Spinner.hide();
        this.pnlMenu.close();
    }

    async btnRedo_onClick(e: JQuery.Event) {
        if (!this.budget) return;
        if (!this.budget.CanRedo) return;
        Spinner.show();
        await this.budget.Redo();
        Spinner.hide();
        this.pnlMenu.close();
    }

    btnSearch_onClick(e: JQuery.Event) {
        this.pnlMenu.close();

        let searchForm = new SearchDialog(this.budget.Transactions);
        searchForm.GotoPeriod = async (date: string) => {
            searchForm.close();
            await this.budget.gotoDate(date);
        }
        searchForm.open();
    }

    async btnToday_onClick(e: JQuery.Event) {
        e.preventDefault();
        await this.budget.gotoDate(Date.today());
    }

    async btnPrev_onClick(e: JQuery.Event) {
        e.preventDefault();
        if (this.periodStart > this.budget.Config.start) {
            await this.budget.gotoDate(Date.parseFb(this.periodStart).subtract(this.budget.Config.length) as Date);
        }
    }

    async periodMenu_onChange(e: JQuery.Event) {
        e.preventDefault();
        await this.budget.gotoDate(this.periodMenu.val().toString())
    }

    async btnNext_onClick(e: JQuery.Event) {
        e.preventDefault();
        await this.budget.gotoDate(Date.parseFb(this.periodStart).add(this.budget.Config.length));
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
        this.logout();
    }

    btnNewRecurring_onClick(e: JQuery.Event) : void {
        this.transactionList.addRecurring(this.periodStart);
    }

    btnConfig_onClick(e: JQuery.Event) : void {
        this.pnlMenu.close();
        let configDialog = new ConfigDialog(this.budget.Config, () => {
            this.budget.Config.write();
            // reload the periods
            this.config_onRead();
        }, this.setTheme.bind(this));
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

    async btnDowloadPeriodAsCsv_onClick(e: JQuery.Event) {
        let data = await this.budget.Transactions.getCsv(this.periodStart, this.periodEnd);
        let filename = `budget-${Date.parseFb(this.periodStart).format('MMM d')} to ${Date.parseFb(this.periodEnd).format('MMM d')}.csv`;
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

        let message = "";
        let cash = this.budget.Transactions.Cash;
        if (cash.hundreds) {
            message += `${ cash.hundreds } x $100 Bills (${ (cash.hundreds * 100.0).toCurrency() })<br/>`
        }
        if (cash.fifties) {
            message += `${ cash.fifties } x $50 Bills (${ (cash.fifties * 50.0).toCurrency() })<br/>`
        }
        if (cash.twenties) {
            message += `${ cash.twenties } x $20 Bills (${ (cash.twenties * 20.0).toCurrency() })<br/>`
        }
        if (cash.tens) {
            message += `${ cash.tens } x $10 Bills (${ (cash.tens * 10.0).toCurrency() })<br/>`
        }
        if (cash.fives) {
            message += `${ cash.fives } x $5 Bills (${ (cash.fives * 5.0).toCurrency() })<br/>`
        }
        if (cash.ones) {
            message += `${ cash.ones } x $1 Bills (${ (cash.ones * 1.0).toCurrency() })<br/>`
        }
        if (cash.cent25) {
            message += `${ cash.cent25 } x Quarters (${ (cash.cent25 * 0.25).toCurrency() })<br/>`
        }
        if (cash.cent10) {
            message += `${ cash.cent10 } x Dimes (${ (cash.cent25 * 0.1).toCurrency() })<br/>`
        }
        if (cash.cent5) {
            message += `${ cash.cent5 } x Nickels (${ (cash.cent5 * 0.05).toCurrency() })<br/>`
        }
        if (cash.cent1) {
            message += `${ cash.cent1 } x Pennies (${ (cash.cent1 * 0.01).toCurrency() })<br/>`
        }

        if (message == "") {
            message = "No Cash Withdrawals";
        } else {
            message += `TOTAL: ${cash.getTotal().toCurrency()}`;
        }
        MessageBox.show(message, "Cash Withdrawal", MessageBox.Buttons.OK, MessageBoxIcon.Information);
    }

    btnTransfer_onClick(e: JQuery.Event) : void {
        e.preventDefault();
        this.pnlMenu.close();

        // let transferDialog = new TransferDialog(this.budget.Transactions.Transfer);
        // transferDialog.open();
        let transfer = this.budget.Transactions.Transfer;
        let title = "No Transfers";
        if (transfer < 0) title = "Transfer from Savings";
        if (transfer > 0) title = "Transfer into Savings";
        MessageBox.show(`Total: ${Math.abs(transfer).toCurrency()}`, title, MessageBox.Buttons.OK, MessageBox.Icon.Information);
    }

    async transactionList_PreviewTransaction(id: string) : Promise<Array<Transaction>> {
        let transaction = await this.budget.Transactions.load(id);
        let previewTransactions = await this.budget.Transactions.getSame(transaction);

        if (previewTransactions != null) {
            this.previewer.setTransaction(transaction);
        }

        return previewTransactions || [];
    }

    // Configuration
    async config_onRead() {
        this.setTheme(this.budget.Config.theme);
        this.periodMenu.empty();

        this.transactionList = new TransactionList('#tblTransactions', this.budget.Config);
        // wire up the load/save/delete functionality
        this.transactionList.LoadTransaction = (key: string) => { return this.budget.Transactions.load(key); }
        this.transactionList.SaveTransaction = (transaction: Transaction) => { return this.budget.saveTransaction(transaction); }
        this.transactionList.DeleteTransaction = async (key: string) => { return this.budget.removeTransaction(key); }

        this.transactionList.LoadRecurring = (key: string) => { return this.budget.Recurrings.load(key); }
        this.transactionList.SaveRecurring = (transaction: RecurringTransaction) => { return this.budget.saveRecurring(transaction); }
        this.transactionList.DeleteRecurring = (key: string) => { return this.budget.removeRecurring(key); }


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
        await this.budget.gotoDate(this.periodStart);
    }

    setTheme(theme: string) {
        theme = theme || "default"
        $('#theme').attr('href', `/jquery.mobile/css/themes/${theme}/budget.min.css`);
        $('#theme-icons').attr('href', `/jquery.mobile/css/themes/${theme}/jquery.mobile.icons.min.css`);
        $('#theme-extras').attr('href', `/jquery.mobile/css/themes/${theme}/extras.css`);
    }

    // Authorization
    firebase_onAuthStateChanged(user: firebase.User) {
        $(async () => {
            if (user === null) {
                this.budget = null
                Spinner.hide();
                if (this.transactionList) { this.transactionList.clear(); }
                
                // show the login dialog
                this.pnlMenu.close();
                let loginDialog = new LoginDialog(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
                loginDialog.open();
            } else {
                ModalSpinner.show();

                let config = (await firebase.database().ref(user.uid).child('config').once('value')).val() as ConfigurationData;

                if (config === null || config.showWizard == true) {
                    // not yet initilized or need to see the wizard
                    ModalSpinner.hide();
                    await ShowIntroWizard(firebase.database().ref(user.uid).child('config'));
                    ModalSpinner.show();
                }

                this.budget = new Budget(firebase.database().ref(user.uid));

                this.budget.on('config_read', this.config_onRead.bind(this));
                this.budget.on('history_change', () => {
                    this.btnUndo.disabled = !this.budget.CanUndo;
                    this.btnRedo.disabled = !this.budget.CanRedo;
                });

                this.budget.ready().then(() => {
                    this.previewer.listenToTransactions(this.budget.Transactions);
                    this.transactionList.listenToTransactions(this.budget.Transactions);
                    this.chart.listenToTransactions(this.budget.Transactions);
                    this.budget.on('loadperiod', this.periodLoaded.bind(this));
                    // this.gotoDate(Date.today());
                    this.budget.gotoDate(Date.today());

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
        setImmediate(async () => {
            await MessageBox.show(`Thank you for signing up ${username}. Please login now.`, "Welcome", MessageBoxButtons.OK, MessageBoxIcon.Information);
            let dialog = new LoginDialog(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
            dialog.open();
        });
    }

    signup() {
        $(() => {
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

    login(username: string, password: string) : Promise<void> {
        return new Promise((resolve, reject) => {
            $(async () => {
                try {
                    console.log('logging in...');
                    await firebase.auth().signInWithEmailAndPassword(username, password);
                    console.log('no error heard');
                    resolve();
                } catch (error) { console.log(error);
                    reject(error);
                }
            });
        });
    }

    logout() {
        this.periodStart = null;
        $(() => { firebase.auth().signOut(); });
    }

    turnOffUpdates(){
        this.transactionList.turnOffUpdates();
        this.chart.turnOffUpdates();
        this.previewer.turnOffUpdates();
    }

    turnOnUpdates(){
        this.transactionList.turnOnUpdates();
        this.chart.turnOnUpdates();
        this.previewer.turnOnUpdates();
    }
}

new BudgetForm();
