/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./ejs.d.ts" />

import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

import Budget from "./controllers/budget";

import Button from "./components/button";
import Select from "./components/select";
import Renderer from "./components/renderer";
import TransactionList from "./components/transactionlist";
import Previewer from "./components/previewer";
import Spinner from "./components/spinner";

class BudgetForm extends Renderer {
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

    private transactionList : TransactionList;
    private previewer : Previewer;

    constructor() {
        super();

        $(() => {
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

    btnToday_onClick(e: JQueryEventObject) : void {}
    btnPrev_onClick(e: JQueryEventObject) : void {}
    periodMenu_onChange(e: JQueryEventObject) : void {}
    btnNext_onClick(e: JQueryEventObject) : void {}
    btnEditTransaction_onClick(e: JQueryEventObject) : void {}
    btnAddTransaction_onClick(e: JQueryEventObject) : void {}
    btnLogout_onClick(e: JQueryEventObject) : void {}
    btnConfig_onClick(e: JQueryEventObject) : void {}
    btnDownload_onClick(e: JQueryEventObject) : void {}
    btnNewRecurring_onClick(e: JQueryEventObject) : void {}
    btnReport_onClick(e: JQueryEventObject) : void {}
    btnCash_onClick(e: JQueryEventObject) : void {}
    btnTransfer_onClick(e: JQueryEventObject) : void {}

    firebase_onAuthStateChanged(user: firebase.User) {
        
    }

}

Object.defineProperty(window, 'Viewer', {
    get: () => {
        return BudgetForm;
    }
})