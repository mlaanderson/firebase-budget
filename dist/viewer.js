"use strict";
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./ejs.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const firebase = require("firebase");
// import Budget from "./controllers/budget";
const button_1 = require("./components/button");
const select_1 = require("./components/select");
const renderer_1 = require("./components/renderer");
class BudgetForm extends renderer_1.default {
    constructor() {
        super();
        $(() => {
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
    btnToday_onClick(e) { }
    btnPrev_onClick(e) { }
    periodMenu_onChange(e) { }
    btnNext_onClick(e) { }
    btnEditTransaction_onClick(e) { }
    btnAddTransaction_onClick(e) { }
    btnLogout_onClick(e) { }
    btnConfig_onClick(e) { }
    btnDownload_onClick(e) { }
    btnNewRecurring_onClick(e) { }
    btnReport_onClick(e) { }
    btnCash_onClick(e) { }
    btnTransfer_onClick(e) { }
    firebase_onAuthStateChanged(user) {
    }
}
