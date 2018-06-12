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
const spinner_1 = require("./components/spinner");
const searchdialog_1 = require("./components/searchdialog");
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
    // UI Events
    btnSearch_onClick(e) {
        $('#menu_panel').panel('close');
        let searchForm = new searchdialog_1.default(this.budget.Transactions);
        searchForm.GotoPeriod = (date) => {
            searchForm.close();
            let { start } = this.budget.Config.calculatePeriod(date);
            this.gotoPeriod(start);
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
        $('#menu_panel').panel('close');
        console.log('logging out');
        this.logout();
    }
    btnConfig_onClick(e) { }
    btnDownload_onClick(e) { }
    btnNewRecurring_onClick(e) { }
    btnReport_onClick(e) { }
    btnCash_onClick(e) { }
    btnTransfer_onClick(e) { }
    // Configuration
    config_onRead() {
        this.periodMenu.empty();
        this.transactionList = new transactionlist_1.default('#tblTransactions', this.budget.Config);
        // wire up the load/save/delete functionality
        this.transactionList.LoadTransaction = (key) => { return this.budget.Transactions.load(key); };
        this.transactionList.SaveTransaction = (transaction) => { return this.budget.Transactions.save(transaction); };
        this.transactionList.DeleteTransaction = (key) => __awaiter(this, void 0, void 0, function* () { return this.budget.Transactions.remove(key); });
        this.transactionList.LoadRecurring = (key) => { return this.budget.Recurrings.load(key); };
        this.transactionList.SaveRecurring = (transaction) => { return this.budget.Recurrings.save(transaction); };
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
        this.gotoPeriod(this.periodStart);
    }
    // Data Events
    budget_onTransactionChanged(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
                this.transactionList.update(transaction);
            }
            if (this.periodEnd >= transaction.date) {
                let total = yield this.budget.Transactions.getTotal();
                this.transactionList.setTotal(total);
            }
        });
    }
    budget_onPeriodLoaded(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            let total = yield this.budget.Transactions.getTotal();
            this.transactionList.displayList(this.budget.Transactions.List, total);
            spinner_1.default.hide();
        });
    }
    budget_onTransactionAddedInPeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("budget_onTransactionAddedInPeriod");
            let total = yield this.budget.Transactions.getTotal();
            this.transactionList.update(transaction, total);
        });
    }
    budget_onTransactionAddedBeforePeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("budget_onTransactionAddedBeforePeriod");
            let total = yield this.budget.Transactions.getTotal();
            this.transactionList.setTotal(total);
        });
    }
    budget_onTransactionAdded(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("budget_onTransactionAdded");
            //TODO: Update chart
        });
    }
    budget_onTransactionRemovedInPeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("budget_onTransactionRemovedInPeriod");
            let total = yield this.budget.Transactions.getTotal();
            this.transactionList.displayList(this.budget.Transactions.List, total);
            spinner_1.default.hide();
        });
    }
    budget_onTransactionRemovedBeforePeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("budget_onTransactionRemovedBeforePeriod");
            let total = yield this.budget.Transactions.getTotal();
            this.transactionList.update(transaction, total);
        });
    }
    budget_onTransactionRemoved(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("budget_onTransactionRemoved");
            //TODO: Update chart
        });
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
            }
            else {
                spinner_1.default.show();
                this.budget = new budget_1.default(firebase.database().ref(user.uid));
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
