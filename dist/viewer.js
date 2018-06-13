"use strict";
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/jquerymobile/index.d.ts" />
/// <reference path="./ejs.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("./lib/date.ext");
require("./lib/number.ext");
const budget_1 = require("./controllers/budget");
const button_1 = require("./components/button");
const select_1 = require("./components/select");
const renderer_1 = require("./components/renderer");
const transactionlist_1 = require("./components/transactionlist");
const previewer_1 = require("./components/previewer");
const spinner_1 = require("./components/spinner");
const searchdialog_1 = require("./components/searchdialog");
const panel_1 = require("./components/panel");
const cashdialog_1 = require("./components/cashdialog");
const transferdialog_1 = require("./components/transferdialog");
const configdialog_1 = require("./components/configdialog");
const logindialog_1 = require("./components/logindialog");
const historychart_1 = require("./components/historychart");
const periodreport_1 = require("./components/periodreport");
class BudgetForm extends renderer_1.default {
    constructor() {
        super();
        this.app = firebase.initializeApp({
            apiKey: "AIzaSyDhs0mPVlovk6JHnEdv6HeU2jy3M8VRoSk",
            authDomain: "budget-dacac.firebaseapp.com",
            databaseURL: "https://budget-dacac.firebaseio.com",
            storageBucket: "budget-dacac.appspot.com"
        });
        $(() => {
            this.btnSearch = new button_1.default('#btnSearch').on('click', this.btnSearch_onClick.bind(this));
            this.btnToday = new button_1.default('#btnToday').on('click', this.btnToday_onClick.bind(this));
            this.btnPrev = new button_1.default('#btnPrev').on('click', this.btnPrev_onClick.bind(this));
            this.periodMenu = new select_1.default('#periodMenu').on('change', this.periodMenu_onChange.bind(this));
            this.btnNext = new button_1.default('#btnNext').on('click', this.btnNext_onClick.bind(this));
            this.btnEditTransaction = new button_1.default('#btnEditTransaction').on('click', this.btnEditTransaction_onClick.bind(this));
            this.btnAddTransaction = new button_1.default('#btnAddTransaction').on('click', this.btnAddTransaction_onClick.bind(this));
            this.btnLogout = new button_1.default('#btnLogout').on('click', this.btnLogout_onClick.bind(this));
            this.btnConfig = new button_1.default('#btnConfig').on('click', this.btnConfig_onClick.bind(this));
            this.btnDownload = new button_1.default('#btnDownload').on('click', this.btnDownload_onClick.bind(this));
            this.btnNewRecurring = new button_1.default('#btnNewRecurring').on('click', this.btnNewRecurring_onClick.bind(this));
            this.btnReport = new button_1.default('#btnReport').on('click', this.btnReport_onClick.bind(this));
            this.btnCash = new button_1.default('#btnCash').on('click', this.btnCash_onClick.bind(this));
            this.btnTransfer = new button_1.default('#btnTransfer').on('click', this.btnTransfer_onClick.bind(this));
            this.pnlMenu = new panel_1.default('#menu_panel');
            this.previewer = new previewer_1.default('.info_div');
            this.chart = new historychart_1.default('chart_div');
            this.previewer.GotoTransaction = this.gotoDate.bind(this);
            firebase.auth().onAuthStateChanged(this.firebase_onAuthStateChanged.bind(this));
        });
    }
    gotoPeriod(period) {
        if (typeof period == "string") {
            period = Date.parseFb(period);
        }
        else {
            period = period;
        }
        let end = period.add(this.budget.Config.length).subtract("1 day");
        this.periodStart = period.toFbString();
        this.periodEnd = end.toFbString();
        this.periodMenu.val(this.periodStart);
        this.periodMenu.refresh();
        document.title = `${period.format("MMM d")} - ${end.format("MMM d")}`;
        this.budget.gotoDate(this.periodStart);
    }
    gotoDate(date) {
        let { start } = this.budget.Config.calculatePeriod(date);
        this.gotoPeriod(start);
    }
    // UI Events
    btnSearch_onClick(e) {
        this.pnlMenu.close();
        let searchForm = new searchdialog_1.default(this.budget.Transactions);
        searchForm.GotoPeriod = (date) => {
            searchForm.close();
            this.gotoDate(date);
        };
        searchForm.open();
    }
    btnToday_onClick(e) {
        e.preventDefault();
        let { start } = this.budget.Config.calculatePeriod(Date.today());
        this.gotoPeriod(start);
    }
    btnPrev_onClick(e) {
        e.preventDefault();
        this.gotoPeriod(Date.parseFb(this.periodStart).subtract(this.budget.Config.length));
    }
    periodMenu_onChange(e) {
        e.preventDefault();
        this.gotoPeriod(this.periodMenu.val().toString());
    }
    btnNext_onClick(e) {
        e.preventDefault();
        this.gotoPeriod(Date.parseFb(this.periodStart).add(this.budget.Config.length));
    }
    btnEditTransaction_onClick(e) {
        this.transactionList.editSelected();
    }
    btnAddTransaction_onClick(e) {
        this.transactionList.addTransaction(this.periodStart);
    }
    btnLogout_onClick(e) {
        e.preventDefault();
        this.pnlMenu.close();
        console.log('logging out');
        this.logout();
    }
    btnNewRecurring_onClick(e) {
        this.transactionList.addRecurring(this.periodStart);
    }
    btnConfig_onClick(e) {
        this.pnlMenu.close();
        let configDialog = new configdialog_1.default(this.budget.Config, () => {
            this.budget.Config.write();
        });
        configDialog.open();
    }
    btnReport_onClick(e) {
        this.pnlMenu.close();
        let dialog = new periodreport_1.default();
        dialog.listenToTransactions(this.budget.Transactions);
        dialog.open();
    }
    btnDownload_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let backup = yield this.budget.getBackup();
            let stringData = JSON.stringify(backup);
            let blob = new Blob([stringData], { type: 'application/json' });
            let filename = 'budget-' + Date.today().toFbString() + '.json';
            if (window.navigator.msSaveBlob) {
                window.navigator.msSaveBlob(blob, filename);
            }
            else {
                let elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = filename;
                elem.style.display = 'none';
                document.body.appendChild(elem);
                elem.click();
                document.body.removeChild(elem);
            }
            this.pnlMenu.close();
        });
    }
    btnCash_onClick(e) {
        e.preventDefault();
        this.pnlMenu.close();
        let cashDialog = new cashdialog_1.default(this.budget.Transactions.Cash);
        cashDialog.open();
    }
    btnTransfer_onClick(e) {
        e.preventDefault();
        this.pnlMenu.close();
        let transferDialog = new transferdialog_1.default(this.budget.Transactions.Transfer);
        transferDialog.open();
    }
    transactionList_PreviewTransaction(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.budget.Transactions.load(id);
            let previewTransactions = yield this.budget.Transactions.getSame(transaction);
            if (previewTransactions != null) {
                this.previewer.displayList(previewTransactions);
            }
            return previewTransactions || [];
        });
    }
    // Configuration
    config_onRead() {
        this.periodMenu.empty();
        this.transactionList = new transactionlist_1.default('#tblTransactions', this.budget.Config);
        // wire up the load/save/delete functionality
        this.transactionList.LoadTransaction = (key) => { return this.budget.Transactions.load(key); };
        this.transactionList.SaveTransaction = (transaction) => { return this.budget.Transactions.save(transaction); };
        this.transactionList.DeleteTransaction = (key) => __awaiter(this, void 0, void 0, function* () { return this.budget.Transactions.remove(key); });
        this.transactionList.LoadRecurring = (key) => { return this.budget.Recurrings.load(key); };
        this.transactionList.SaveRecurring = (transaction) => { console.log("saving", transaction); return this.budget.Recurrings.save(transaction); };
        this.transactionList.DeleteRecurring = (key) => { return this.budget.Recurrings.remove(key); };
        for (let date = Date.parseFb(this.budget.Config.start); date.le(Date.today().add('5 years')); date = date.add(this.budget.Config.length)) {
            let label = date.format("MMM d") + " - " + date.add(this.budget.Config.length).subtract("1 day").format("MMM d, yyyy");
            this.periodMenu.append(date.toFbString(), label);
        }
        if (this.periodStart) {
            let { start, end } = this.budget.Config.calculatePeriod(this.periodStart);
            this.periodStart = start;
            this.periodEnd = end;
        }
        else {
            let { start, end } = this.budget.Config.calculatePeriod(Date.today());
            this.periodStart = start;
            this.periodEnd = end;
        }
        this.transactionList.PreviewTransaction = (id) => {
            return this.transactionList_PreviewTransaction(id);
        };
        this.gotoPeriod(this.periodStart);
    }
    // Authorization
    firebase_onAuthStateChanged(user) {
        $(() => {
            if (user === null) {
                this.budget = null;
                spinner_1.default.hide();
                if (this.transactionList) {
                    this.transactionList.clear();
                }
                // show the login dialog
                this.pnlMenu.close();
                let loginDialog = new logindialog_1.default(this.login);
                loginDialog.open();
            }
            else {
                spinner_1.default.show();
                this.budget = new budget_1.default(firebase.database().ref(user.uid));
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
    login(username, password) {
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
});
