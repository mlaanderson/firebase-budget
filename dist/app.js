"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_1 = require("./types/transaction");
const form_1 = require("./form");
const firebase = require("firebase");
require("./lib/math.ext");
require("./lib/date.ext");
class Config {
    static read(root) {
        return __awaiter(this, void 0, void 0, function* () {
            let snap;
            let config;
            snap = yield root.child('config').once('value');
            config = snap.val();
            if (config == null) {
                // set the defaults to the account
                root.child('config/categories').set(Config.CATEGORIES);
                root.child('config/periods').set({
                    length: '2 weeks',
                    start: Date.today().toFbString()
                });
                root.child('accounts').push({ name: 'Primary' });
            }
            else {
                Config.CATEGORIES = config.categories;
                if (config.periods !== undefined) {
                    Config.PERIOD_START = config.periods.start || "2016-06-24";
                    Config.PERIOD_LENGTH = config.periods.length || "2 weeks";
                }
            }
        });
    }
    static write(root) {
        return __awaiter(this, void 0, void 0, function* () {
            yield root.child('config/categories').set(Config.CATEGORIES);
            yield root.child('config/periods').set({
                length: Config.PERIOD_LENGTH,
                start: Config.PERIOD_START
            });
        });
    }
}
Config.CATEGORIES = [
    "Income",
    "Charity",
    "Saving",
    "Housing",
    "Utilities",
    "Food",
    "Clothing",
    "Transportation",
    "Medical",
    "Insurance",
    "Personal",
    "Recreation",
    "Debt"
];
Config.PERIOD_START = "2016-06-24";
Config.PERIOD_LENGTH = "2 weeks";
exports.Config = Config;
class Application {
    constructor() {
        this.m_loading = true;
        this.m_form = new form_1.default(this);
        this.m_today = Date.today();
        this.m_app = firebase.initializeApp({
            apiKey: "AIzaSyDhs0mPVlovk6JHnEdv6HeU2jy3M8VRoSk",
            authDomain: "budget-dacac.firebaseapp.com",
            databaseURL: "https://budget-dacac.firebaseio.com",
            storageBucket: "budget-dacac.appspot.com"
        });
        this.m_app.auth().onAuthStateChanged(this.app_AuthStateChanged.bind(this));
    }
    app_AuthStateChanged(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user === null) {
                this.m_primaryAccount = null;
                this.m_form.clear();
            }
            else {
                this.m_form.loading();
                yield Config.read(this.root);
                this.m_form.onConfigLoaded();
                let snap;
                snap = yield this.root.child('accounts').orderByChild('name').equalTo('Primary').once('child_added');
                if (snap.val() !== null) {
                    this.m_primaryAccount = snap.ref;
                }
                else {
                    this.m_primaryAccount = this.root.child('accounts').push();
                    this.m_primaryAccount.set({ name: 'Primary' });
                }
                // setup the transaction listeners
                this.transactions.on('child_changed', this.onTransactionChanged.bind(this));
                this.transactions.on('child_added', this.onTransactionAdded.bind(this));
                this.transactions.on('child_removed', this.onTransactionRemoved.bind(this));
                // show the screens
                let transactions = yield this.selectPeriod();
                this.m_form.updateTransactions(transactions);
            }
        });
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let credentials;
            try {
                credentials = yield this.m_app.auth().signInWithEmailAndPassword(username, password);
            }
            catch (error) {
                throw error;
            }
            return credentials;
        });
    }
    onTransactionChanged(snap) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.m_loading == true)
                return;
            let transaction = snap.val();
            transaction.id = snap.key;
            this.m_form.updateTransaction(transaction);
            this.m_form.updatePreview(transaction);
            this.m_form.updateChart();
            let sum = yield this.getPeriodSum();
            this.m_form.updateTotal(sum);
        });
    }
    onTransactionAdded(snap) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.m_loading == true)
                return;
            let transaction = snap.val();
            transaction.id = snap.key;
            if (this.m_periodStart <= transaction.date && transaction.date <= this.m_periodEnd) {
                // update the transaction
                this.m_form.updateTransaction(transaction);
            }
            this.m_form.updatePreview(transaction);
            this.m_form.updateChart();
            if (transaction.date <= this.m_periodEnd) {
                // update the total
                let sum = yield this.getPeriodSum();
                this.m_form.updateTotal(sum);
            }
        });
    }
    onTransactionRemoved(snap) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.m_loading == true)
                return;
            this.m_form.removeTransaction(snap.key);
            this.m_form.updateTotal(yield this.getPeriodSum());
            this.m_form.updateChart();
        });
    }
    get root() {
        if (this.m_app.auth().currentUser == null) {
            throw new Error("Not signed in");
        }
        return this.m_app.database().ref().child(this.m_app.auth().currentUser.uid);
    }
    /** Used in some templates */
    get Categories() {
        return Config.CATEGORIES;
    }
    get transactions() {
        return this.m_primaryAccount.child('transactions');
    }
    get recurring() {
        return this.m_primaryAccount.child('recurring');
    }
    signout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.m_app.auth().signOut();
        });
    }
    getTransaction(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let tsnap = yield this.transactions.child(key).once('value');
            let item = tsnap.val();
            item.id = key;
            return item;
        });
    }
    saveTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let id;
            // null out the empty strings in check, checkLink and note
            transaction.check = transaction.check || null;
            transaction.checkLink = transaction.checkLink || null;
            transaction.note = transaction.note || null;
            transaction.cash = transaction.cash || false;
            transaction.paid = transaction.paid || false;
            transaction.transfer = transaction.transfer || false;
            transaction.recurring = transaction.recurring || null;
            if (transaction.id) {
                // existing transaction, update it
                id = transaction.id;
                // delete the id property, it doesn't get saved
                delete transaction.id;
                yield this.transactions.child(id).set(transaction);
            }
            else {
                // new transaction, save it
                let ref = yield this.transactions.push(transaction);
                transaction.id = ref.key;
            }
        });
    }
    deleteTransaction(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transactions.child(key).remove();
        });
    }
    getRecurringTransaction(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let tsnap = yield this.recurring.child(key).once('value');
            let item = tsnap.val();
            item.id = key;
            return item;
        });
    }
    saveRecurringTransaction(recurring) {
        return __awaiter(this, void 0, void 0, function* () {
            let rId = recurring.id || null;
            let date = Date.today().toFbString();
            date = date > this.m_periodStart ? date : this.m_periodStart;
            delete recurring.id;
            console.log(recurring);
            if (rId) {
                // update the recurring node
                yield this.recurring.child(rId).set(recurring);
            }
            else {
                console.log("CREATING NEW RECURRING ENTRY");
                let ref = yield this.recurring.push(recurring);
                rId = ref.key;
                console.log("PUSHED", rId);
            }
            // delete all matching after this date or today whichever is later
            yield this.deleteRecurring(rId, false);
            // re-insert new transaction nodes starting with today or start whichever is later
            for (let day = Date.parseFb(recurring.start); day.le(recurring.end); day = day.add(recurring.period)) {
                if (day.toFbString() < date)
                    continue;
                let transaction = {
                    date: day.toFbString(),
                    category: recurring.category,
                    name: recurring.name,
                    amount: recurring.amount,
                    cash: recurring.cash || false,
                    paid: false,
                    transfer: recurring.transfer || false,
                    note: recurring.note || null,
                    recurring: rId
                };
                yield this.transactions.push(transaction);
            }
        });
    }
    deleteRecurring(id, deleteRecurringNode = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let date = Date.today().toFbString();
            date = date > this.m_periodStart ? date : this.m_periodStart;
            // delete the recurring 
            if (deleteRecurringNode == true) {
                yield this.recurring.child(id).remove();
            }
            // delete all matching after this date or today whichever is later
            let transactions = yield this.getRecurringTransactions(id);
            for (let key in transactions) {
                let transaction = transactions[key];
                if ((transaction.date >= date) && (transaction.paid !== true)) {
                    yield this.deleteTransaction(key);
                }
            }
        });
    }
    getRecurringTransactions(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let snap = yield this.transactions.orderByChild('recurring').startAt(id).endAt(id).once('value');
            let transactions = snap.val();
            return transactions;
        });
    }
    getSameTransactions(item) {
        return __awaiter(this, void 0, void 0, function* () {
            let snap = yield this.transactions.orderByChild('name').startAt(item.name).endAt(item.name).once('value');
            let transactions = snap.val();
            let items = [];
            for (var k in transactions) {
                if (transactions[k].category === item.category) {
                    transactions[k].id = k;
                    items.push(transactions[k]);
                }
            }
            items.sort((o1, o2) => {
                let d1 = Date.parseFb(o1.date);
                let d2 = Date.parseFb(o2.date);
                return d1.getTime() - d2.getTime();
            });
            return items;
        });
    }
    gotoPeriod(start) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof start == "string") {
                start = Date.parseFb(start);
            }
            this.m_today = start;
            let transactions = yield this.selectPeriod();
            return transactions;
        });
    }
    selectPeriod() {
        return __awaiter(this, void 0, void 0, function* () {
            let startDate = this.m_today.periodCalc(Config.PERIOD_START, Config.PERIOD_LENGTH);
            this.m_periodStart = startDate.toFbString();
            this.m_periodEnd = startDate.add(Config.PERIOD_LENGTH).subtract("1 day").toFbString();
            let snap;
            snap = yield this.transactions.orderByChild('date').startAt(this.m_periodStart).endAt(this.m_periodEnd).once('value');
            let items = transaction_1.default.sort(snap.val());
            this.m_loading = false;
            return items;
        });
    }
    getOutstandingChecksTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            let csnap;
            let checks;
            let sum = 0;
            csnap = yield this.m_primaryAccount.child('checks').once('value');
            checks = csnap.val();
            for (var key in checks) {
                if (checks[key].link === undefined) {
                    sum = Math.roundTo(sum - checks[key].amount, 2);
                }
            }
            return sum;
        });
    }
    getPeriodSum() {
        return __awaiter(this, void 0, void 0, function* () {
            let snap;
            let sum = 0;
            let checks = yield this.getOutstandingChecksTotal();
            let transactions;
            snap = yield this.transactions.orderByChild('date').endAt(this.m_periodEnd).once('value');
            transactions = snap.val();
            for (var key in transactions) {
                sum = Math.roundTo(sum + transactions[key].amount, 2);
            }
            return sum + checks;
        });
    }
    getDateTotals() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            let sum = yield this.getOutstandingChecksTotal();
            let snap;
            let data;
            let transactions = new Array();
            snap = yield this.transactions.once('value');
            data = snap.val();
            for (var key in data) {
                transactions.push(data[key]);
            }
            transactions.sort((t1, t2) => {
                if (t1.date > t2.date)
                    return 1;
                if (t1.date < t2.date)
                    return -1;
                return 0;
            });
            for (var transaction of transactions) {
                sum = Math.roundTo(sum + transaction.amount, 2);
                result[transaction.date] = sum;
            }
            return result;
        });
    }
    clearCheck(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.m_primaryAccount.child('checks').child(id).remove();
        });
    }
    getData() {
        return __awaiter(this, void 0, void 0, function* () {
            let snap = yield this.root.once('value');
            let data = snap.val();
            return data;
        });
    }
}
exports.default = Application;
$(() => {
    var app = new Application();
    Object.defineProperty(window, 'app', {
        get: () => { return app; }
    });
});
