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
require("firebase/auth");
require("firebase/database");
const events_1 = require("./events");
const config_1 = require("./config");
const transactions_1 = require("./transactions");
const recurringtransactions_1 = require("./recurringtransactions");
const historymanager_1 = require("./historymanager");
require("../lib/date.ext");
class Budget extends events_1.default {
    constructor(reference) {
        super();
        this.isReady = false;
        this.root = reference;
        this.config = new config_1.default(reference);
        this.root.child('name').once('value').then((snap) => {
            console.log('Running on:', snap.val().toString());
        });
        this.config.read().then(() => {
            this.root.child('accounts').orderByChild('name').startAt('Primary').endAt('Primary').once('child_added').then((snap) => {
                this.account = snap.ref;
                this.transactions = new transactions_1.default(this.account.child('transactions'));
                this.recurring = new recurringtransactions_1.default(this.account.child('recurring'));
                this.history = new historymanager_1.default(this.transactions, this.recurring);
                this.history.on('change', () => {
                    this.emitAsync('history_change');
                });
                this.emitAsync("config_read");
            });
        });
        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolver = resolve;
        });
    }
    get CanUndo() {
        return this.history && this.history.canUndo;
    }
    get CanRedo() {
        return this.history && this.history.canRedo;
    }
    Undo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.history.undo();
        });
    }
    Redo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.history.redo();
        });
    }
    get Transactions() {
        return this.transactions;
    }
    get Recurrings() {
        return this.recurring;
    }
    get Config() {
        return this.config;
    }
    get Start() {
        return this.transactions.Start;
    }
    get End() {
        return this.transactions.End;
    }
    ready() {
        return this.readyPromise;
    }
    gotoDate(date) {
        return __awaiter(this, void 0, void 0, function* () {
            this.period = this.config.calculatePeriod(date);
            yield this.transactions.loadPeriod(this.period.start, this.period.end);
            if (this.isReady === false) {
                this.isReady = true;
                this.readyResolver(true);
            }
            this.emitAsync('loadperiod', this.transactions.Records, this);
        });
    }
    getBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            let snapshot = yield this.root.once('value');
            return snapshot.val();
        });
    }
    setBackup(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.account.set(data);
        });
    }
    saveTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let initial = transaction.id ? yield this.transactions.load(transaction.id) : null;
            let change = {
                items: [{
                        action: transaction.id ? "change" : "create",
                        type: "Transaction",
                        initial: initial,
                        final: transaction
                    }]
            };
            let id = yield this.Transactions.save(transaction);
            change.items[0].final.id = id;
            this.history.push(change);
            return id;
        });
    }
    removeTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof transaction === "string") {
                transaction = yield this.transactions.load(transaction);
            }
            let id = yield this.Transactions.remove(transaction);
            this.history.push({
                items: [{
                        action: "delete",
                        type: "Transaction",
                        final: transaction
                    }]
            });
            return id;
        });
    }
    saveRecurring(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let changes;
            let initial = null;
            let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
            if (date < this.transactions.Start) {
                date = this.transactions.Start;
            }
            if (transaction.id) {
                initial = yield this.Recurrings.load(transaction.id);
                initial.active = date;
            }
            // prepare the changes
            changes = {
                items: [{
                        action: transaction.id ? "change" : "create",
                        type: "Recurring",
                        initial: initial,
                        final: transaction
                    }]
            };
            // Update the transaction - setting the active key makes 
            // all the linked creating/deleting happen on the server
            transaction.active = date;
            let id = yield this.Recurrings.save(transaction);
            changes.items[0].final.id = id;
            this.history.push(changes);
            return id;
        });
    }
    removeRecurring(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof transaction === "string") {
                transaction = yield this.recurring.load(transaction);
            }
            let changes = {
                items: [{
                        action: "delete",
                        type: "Recurring",
                        final: transaction
                    }]
            };
            if (transaction.id) {
                let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
                if (date < this.transactions.Start) {
                    date = this.transactions.Start;
                }
                transaction.delete = date;
                yield this.Recurrings.save(transaction);
                this.history.push(changes);
            }
            return transaction.id;
        });
    }
    rollUpTo(date) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let oldTransactions = (yield this.account.child('transactions').orderByChild('date').startAt(this.config.start).endAt(date).once('value')).val();
            let rolledTransactions = {};
            for (let key in oldTransactions) {
                let old = oldTransactions[key];
                if (rolledTransactions[old.category] == null) {
                    rolledTransactions[old.category] = {};
                }
                if (rolledTransactions[old.category][old.name] == null) {
                    rolledTransactions[old.category][old.name] = old;
                    rolledTransactions[old.category][old.name].date = date;
                }
                else {
                    rolledTransactions[old.category][old.name].amount += old.amount;
                }
            }
            let promises = [];
            for (let key in oldTransactions) {
                promises.push(this.account.child('transactions').child(key).remove());
            }
            for (let category in rolledTransactions) {
                for (let name in rolledTransactions[category]) {
                    promises.push(new Promise((resolve, reject) => {
                        this.account.child('transactions').push(rolledTransactions[category][name]).then(() => {
                            resolve();
                        });
                    }));
                }
            }
            yield Promise.all(promises);
            resolve();
        }));
    }
}
exports.default = Budget;
