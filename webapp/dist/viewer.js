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
const modalspinner_1 = require("./components/modalspinner");
const searchdialog_1 = require("./components/searchdialog");
const panel_1 = require("./components/panel");
const configdialog_1 = require("./components/configdialog");
const logindialog_1 = require("./components/logindialog");
const historychart_1 = require("./components/historychart");
const periodreport_1 = require("./components/periodreport");
const ytdreport_1 = require("./components/ytdreport");
const forgotpassworddialog_1 = require("./components/forgotpassworddialog");
const messagebox_1 = require("./components/messagebox");
const signupdialog_1 = require("./components/signupdialog");
const introwizard_1 = require("./introwizard");
const emergencyfundwizard_1 = require("./emergencyfundwizard");
const setupwizard_1 = require("./components/setupwizard");
window.setup = setupwizard_1.default;
window.MessageBox = messagebox_1.default;
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
            this.btnDownloadAsCsv = new button_1.default('#btnDownloadAsCsv').on('click', this.btnDownloadAsCsv_onClick.bind(this));
            this.btnDowloadPeriodAsCsv = new button_1.default('#btnDowloadPeriodAsCsv').on('click', this.btnDowloadPeriodAsCsv_onClick.bind(this));
            this.btnNewRecurring = new button_1.default('#btnNewRecurring').on('click', this.btnNewRecurring_onClick.bind(this));
            this.btnReport = new button_1.default('#btnReport').on('click', this.btnReport_onClick.bind(this));
            this.btnYtdReport = new button_1.default('#btnYtdReport').on('click', this.btnYtdReport_onClick.bind(this));
            this.btnCash = new button_1.default('#btnCash').on('click', this.btnCash_onClick.bind(this));
            this.btnTransfer = new button_1.default('#btnTransfer').on('click', this.btnTransfer_onClick.bind(this));
            this.btnUndo = new button_1.default('#btnUndo').on('click', this.btnUndo_onClick.bind(this));
            this.btnRedo = new button_1.default('#btnRedo').on('click', this.btnRedo_onClick.bind(this));
            this.pnlMenu = new panel_1.default('#menu_panel');
            this.previewer = new previewer_1.default('.info_div');
            this.btnWizardEmergencyFund = new button_1.default("#btnWizardEmergencyFund").on('click', this.btnWizardEmergencyFund_Click.bind(this));
            this.btnWizardSetup = new button_1.default('#btnWizardSetup').on('click', this.btnWizardSetup_Click.bind(this));
            this.btnUndo.disabled = true;
            this.btnRedo.disabled = true;
            this.chart = new historychart_1.default('chart_div');
            this.previewer.GotoTransaction = (date) => {
                this.budget.gotoDate(date);
            };
            firebase.auth().onAuthStateChanged(this.firebase_onAuthStateChanged.bind(this));
            $(window).on('resize', () => {
                if ('ontouchstart' in document.documentElement == false) {
                    $('#btnEditTransaction').hide();
                }
                else {
                    $('#btnEditTransaction').show();
                }
            });
            if ('ontouchstart' in document.documentElement == false) {
                $('#btnEditTransaction').hide();
            }
            else {
                $('#btnEditTransaction').show();
            }
        });
        // try to bind the ctrl/command keys
        $(document).on('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
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
                    case 'ArrowRight':
                        e.preventDefault();
                        this.btnNext.click();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.btnPrev.click();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.btnToday.click();
                        break;
                }
            }
        });
    }
    periodLoaded() {
        return __awaiter(this, void 0, void 0, function* () {
            this.periodStart = this.budget.Start;
            this.periodEnd = this.budget.End;
            this.periodMenu.val(this.periodStart);
            this.periodMenu.refresh();
            if (this.periodStart <= this.budget.Config.start) {
                this.btnPrev.disabled = true;
            }
            else {
                this.btnPrev.disabled = false;
            }
            $('[data-role=header] h1').text(`${Date.parseFb(this.periodStart).format("MMM d")} - ${Date.parseFb(this.periodEnd).format("MMM d")}`);
            $('#main').animate({ scrollTop: 0 }, "fast");
        });
    }
    download(data, filename, type) {
        let blob = new Blob([data], { type: type });
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
    }
    // Wizards
    btnWizardSetup_Click(e) {
        e.preventDefault();
        this.pnlMenu.close();
        (new setupwizard_1.default(this.budget.Config.categories, this.budget.saveRecurring.bind(this.budget))).open();
    }
    btnWizardEmergencyFund_Click(e) {
        e.preventDefault();
        this.pnlMenu.close();
        emergencyfundwizard_1.default(this);
    }
    // UI Events
    btnUndo_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.budget)
                return;
            if (!this.budget.CanUndo)
                return;
            spinner_1.default.show();
            yield this.budget.Undo();
            spinner_1.default.hide();
            this.pnlMenu.close();
        });
    }
    btnRedo_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.budget)
                return;
            if (!this.budget.CanRedo)
                return;
            spinner_1.default.show();
            yield this.budget.Redo();
            spinner_1.default.hide();
            this.pnlMenu.close();
        });
    }
    btnSearch_onClick(e) {
        this.pnlMenu.close();
        let searchForm = new searchdialog_1.default(this.budget.Transactions);
        searchForm.GotoPeriod = (date) => __awaiter(this, void 0, void 0, function* () {
            searchForm.close();
            yield this.budget.gotoDate(date);
        });
        searchForm.open();
    }
    btnToday_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            yield this.budget.gotoDate(Date.today());
        });
    }
    btnPrev_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            if (this.periodStart > this.budget.Config.start) {
                yield this.budget.gotoDate(Date.parseFb(this.periodStart).add("1 day").subtract(this.budget.Config.length));
            }
        });
    }
    periodMenu_onChange(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            yield this.budget.gotoDate(this.periodMenu.val().toString());
        });
    }
    btnNext_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            yield this.budget.gotoDate(Date.parseFb(this.periodStart).add(this.budget.Config.length));
        });
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
        this.logout();
    }
    btnNewRecurring_onClick(e) {
        this.transactionList.addRecurring(this.periodStart);
    }
    btnConfig_onClick(e) {
        this.pnlMenu.close();
        let configDialog = new configdialog_1.default(this.budget.Config, () => {
            this.budget.Config.write();
            // reload the periods
            this.config_onRead();
        }, this.setTheme.bind(this));
        configDialog.open();
    }
    btnReport_onClick(e) {
        this.pnlMenu.close();
        let dialog = new periodreport_1.default();
        dialog.listenToTransactions(this.budget.Transactions);
        dialog.open();
    }
    btnYtdReport_onClick(e) {
        this.pnlMenu.close();
        let dialog = new ytdreport_1.default();
        dialog.listenToTransactions(this.budget.Transactions);
        dialog.open();
    }
    btnDownloadAsCsv_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.budget.Transactions.getCsv();
            let filename = `budget-${Date.today().toFbString()}.csv`;
            this.download(data, filename, 'text/csv');
            this.pnlMenu.close();
        });
    }
    btnDowloadPeriodAsCsv_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.budget.Transactions.getCsv(this.periodStart, this.periodEnd);
            let filename = `budget-${Date.parseFb(this.periodStart).format('MMM d')} to ${Date.parseFb(this.periodEnd).format('MMM d')}.csv`;
            this.download(data, filename, 'text/csv');
            this.pnlMenu.close();
        });
    }
    btnDownload_onClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let backup = yield this.budget.getBackup();
            let stringData = JSON.stringify(backup);
            let filename = 'budget-' + Date.today().toFbString() + '.json';
            this.download(stringData, filename, 'application/json');
            this.pnlMenu.close();
        });
    }
    btnCash_onClick(e) {
        e.preventDefault();
        this.pnlMenu.close();
        let message = "";
        let cash = this.budget.Transactions.Cash;
        if (cash.hundreds) {
            message += `${cash.hundreds} x $100 Bills (${(cash.hundreds * 100.0).toCurrency()})<br/>`;
        }
        if (cash.fifties) {
            message += `${cash.fifties} x $50 Bills (${(cash.fifties * 50.0).toCurrency()})<br/>`;
        }
        if (cash.twenties) {
            message += `${cash.twenties} x $20 Bills (${(cash.twenties * 20.0).toCurrency()})<br/>`;
        }
        if (cash.tens) {
            message += `${cash.tens} x $10 Bills (${(cash.tens * 10.0).toCurrency()})<br/>`;
        }
        if (cash.fives) {
            message += `${cash.fives} x $5 Bills (${(cash.fives * 5.0).toCurrency()})<br/>`;
        }
        if (cash.ones) {
            message += `${cash.ones} x $1 Bills (${(cash.ones * 1.0).toCurrency()})<br/>`;
        }
        if (cash.cent25) {
            message += `${cash.cent25} x Quarters (${(cash.cent25 * 0.25).toCurrency()})<br/>`;
        }
        if (cash.cent10) {
            message += `${cash.cent10} x Dimes (${(cash.cent25 * 0.1).toCurrency()})<br/>`;
        }
        if (cash.cent5) {
            message += `${cash.cent5} x Nickels (${(cash.cent5 * 0.05).toCurrency()})<br/>`;
        }
        if (cash.cent1) {
            message += `${cash.cent1} x Pennies (${(cash.cent1 * 0.01).toCurrency()})<br/>`;
        }
        if (message == "") {
            message = "No Cash Withdrawals";
        }
        else {
            message += `TOTAL: ${cash.getTotal().toCurrency()}`;
        }
        messagebox_1.default.show(message, "Cash Withdrawal", messagebox_1.default.Buttons.OK, messagebox_1.MessageBoxIcon.Information);
    }
    btnTransfer_onClick(e) {
        e.preventDefault();
        this.pnlMenu.close();
        // let transferDialog = new TransferDialog(this.budget.Transactions.Transfer);
        // transferDialog.open();
        let transfer = this.budget.Transactions.Transfer;
        let title = "No Transfers";
        if (transfer < 0)
            title = "Transfer from Savings";
        if (transfer > 0)
            title = "Transfer into Savings";
        messagebox_1.default.show(`Total: ${Math.abs(transfer).toCurrency()}`, title, messagebox_1.default.Buttons.OK, messagebox_1.default.Icon.Information);
    }
    transactionList_PreviewTransaction(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.budget.Transactions.load(id);
            let previewTransactions = yield this.budget.Transactions.getSame(transaction);
            if (previewTransactions != null) {
                this.previewer.setTransaction(transaction);
            }
            return previewTransactions || [];
        });
    }
    // Configuration
    config_onRead() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setTheme(this.budget.Config.theme);
            this.periodMenu.empty();
            this.transactionList = new transactionlist_1.default('#tblTransactions', this.budget.Config);
            // wire up the load/save/delete functionality
            this.transactionList.LoadTransaction = (key) => { return this.budget.Transactions.load(key); };
            this.transactionList.SaveTransaction = (transaction) => { return this.budget.saveTransaction(transaction); };
            this.transactionList.DeleteTransaction = (key) => __awaiter(this, void 0, void 0, function* () { return this.budget.removeTransaction(key); });
            this.transactionList.LoadNames = () => __awaiter(this, void 0, void 0, function* () { return this.budget.Transactions.LoadNames(); });
            this.transactionList.LoadRecurring = (key) => { return this.budget.Recurrings.load(key); };
            this.transactionList.SaveRecurring = (transaction) => { return this.budget.saveRecurring(transaction); };
            this.transactionList.DeleteRecurring = (key) => { return this.budget.removeRecurring(key); };
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
            yield this.budget.gotoDate(this.periodStart);
        });
    }
    setTheme(theme) {
        theme = theme || "default";
        $('#theme').attr('href', `/jquery.mobile/css/themes/${theme}/budget.min.css`);
        $('#theme-icons').attr('href', `/jquery.mobile/css/themes/${theme}/jquery.mobile.icons.min.css`);
        $('#theme-extras').attr('href', `/jquery.mobile/css/themes/${theme}/extras.css`);
    }
    // Authorization
    firebase_onAuthStateChanged(user) {
        $(() => __awaiter(this, void 0, void 0, function* () {
            if (user === null) {
                this.budget = null;
                spinner_1.default.hide();
                if (this.transactionList) {
                    this.transactionList.clear();
                }
                // show the login dialog
                this.pnlMenu.close();
                let loginDialog = new logindialog_1.default(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
                loginDialog.open();
            }
            else {
                modalspinner_1.default.show();
                let config = (yield firebase.database().ref(user.uid).child('config').once('value')).val();
                if (config === null || config.showWizard == true) {
                    // not yet initilized or need to see the wizard
                    modalspinner_1.default.hide();
                    yield introwizard_1.default(firebase.database().ref(user.uid).child('config'));
                    modalspinner_1.default.show();
                }
                this.budget = new budget_1.default(firebase.database().ref(user.uid));
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
        }));
    }
    sendResetEmail(username) {
        return __awaiter(this, void 0, void 0, function* () {
            firebase.auth().sendPasswordResetEmail(username, {
                url: `${location.origin}?email=${encodeURIComponent(username)}`
            });
            spinner_1.default.hide();
            yield messagebox_1.default.show("The password reset has been sent. Check your inbox for instructions.", "Reset Email Sent", messagebox_1.MessageBoxButtons.OK, messagebox_1.MessageBoxIcon.Information);
            let loginDialog = new logindialog_1.default(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
            loginDialog.open();
        });
    }
    registerAccount(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield firebase.auth().createUserWithEmailAndPassword(username, password);
            setImmediate(() => __awaiter(this, void 0, void 0, function* () {
                yield messagebox_1.default.show(`Thank you for signing up ${username}. Please login now.`, "Welcome", messagebox_1.MessageBoxButtons.OK, messagebox_1.MessageBoxIcon.Information);
                let dialog = new logindialog_1.default(this.login.bind(this), this.resetPassword.bind(this), this.signup.bind(this));
                dialog.open();
            }));
        });
    }
    rollUp(date) {
        return __awaiter(this, void 0, void 0, function* () {
            yield modalspinner_1.default.show(`Archiving transactions before ${date}`);
            setImmediate(() => __awaiter(this, void 0, void 0, function* () {
                yield this.budget.rollUpTo(date);
                modalspinner_1.default.hide();
            }));
        });
    }
    signup() {
        $(() => {
            let dialog = new signupdialog_1.default(this.registerAccount.bind(this));
            dialog.open();
        });
    }
    resetPassword(username) {
        $(() => {
            let dialog = new forgotpassworddialog_1.default(this.sendResetEmail.bind(this), username);
            dialog.open();
        });
    }
    login(username, password) {
        return new Promise((resolve, reject) => {
            $(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log('logging in...');
                    yield firebase.auth().signInWithEmailAndPassword(username, password);
                    console.log('no error heard');
                    resolve();
                }
                catch (error) {
                    console.log(error);
                    reject(error);
                }
            }));
        });
    }
    logout() {
        this.periodStart = null;
        $(() => { firebase.auth().signOut(); });
    }
    turnOffUpdates() {
        this.transactionList.turnOffUpdates();
        this.chart.turnOffUpdates();
        this.previewer.turnOffUpdates();
    }
    turnOnUpdates() {
        this.transactionList.turnOnUpdates();
        this.chart.turnOnUpdates();
        this.previewer.turnOnUpdates();
    }
}
exports.default = BudgetForm;
// declare global {
//     interface Window {
//         viewer: BudgetForm;
//     }
// }
// window.viewer = new BudgetForm();
new BudgetForm();
