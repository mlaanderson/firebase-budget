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
    ready() {
        return this.readyPromise;
    }
    gotoDate(date) {
        return __awaiter(this, void 0, void 0, function* () {
            this.period = this.config.calculatePeriod(date);
            yield this.transactions.loadPeriod(this.period.start, this.period.end);
            this.emitAsync('loadperiod', this.transactions.Records, this);
            if (this.isReady === false) {
                this.isReady = true;
                this.readyResolver(true);
            }
        });
    }
    getBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            let snapshot = yield this.root.once('value');
            return snapshot.val();
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
            if (transaction.id) {
                initial = yield this.Recurrings.load(transaction.id);
            }
            changes = {
                items: [{
                        action: transaction.id ? "change" : "create",
                        type: "Recurring",
                        initial: initial,
                        final: transaction
                    }]
            };
            let id = yield this.Recurrings.save(transaction);
            changes.items[0].final.id = id;
            // update the existing transactions which depend on this
            let recurrings = yield this.transactions.getRecurring(transaction.id);
            let promises = new Array();
            let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
            if (date < this.transactions.Start) {
                date = this.transactions.Start;
            }
            // delete linked transactions after this period or today's period
            // whichever is newer
            for (let k in recurrings) {
                if (recurrings[k].date >= date) {
                    changes.items.push({
                        action: "delete",
                        type: "Transaction",
                        final: recurrings[k]
                    });
                    promises.push(this.transactions.remove(k));
                }
            }
            yield Promise.all(promises);
            promises = [];
            // insert new transactions according to the schedule
            for (let tDate = Date.parseFb(transaction.start); tDate.le(transaction.end); tDate = tDate.add(transaction.period)) {
                if (tDate.toFbString() >= date) {
                    let promise = this.transactions.save({
                        amount: transaction.amount,
                        cash: transaction.cash,
                        category: transaction.category,
                        date: tDate.toFbString(),
                        name: transaction.name,
                        note: transaction.note,
                        recurring: transaction.id,
                        transfer: transaction.transfer
                    }).then(s => {
                        // insert the change into history
                        changes.items.push({
                            action: "create",
                            type: "Transaction",
                            final: {
                                id: s,
                                amount: transaction.amount,
                                cash: transaction.cash,
                                category: transaction.category,
                                date: tDate.toFbString(),
                                name: transaction.name,
                                note: transaction.note,
                                recurring: transaction.id,
                                transfer: transaction.transfer
                            }
                        });
                        return s;
                    });
                    promises.push(promise);
                }
            }
            yield Promise.all(promises);
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
            let id = yield this.Recurrings.remove(transaction);
            let promises = new Array();
            let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
            let recurrings = yield this.transactions.getRecurring(id);
            if (date < this.transactions.Start) {
                date = this.transactions.Start;
            }
            // delete linked transactions after this period or today's period
            // whichever is newer
            for (let k in recurrings) {
                if (recurrings[k].date >= date) {
                    changes.items.push({
                        action: "delete",
                        type: "Transaction",
                        final: recurrings[k]
                    });
                    promises.push(this.transactions.remove(k));
                }
            }
            yield Promise.all(promises);
            this.history.push(changes);
            return id;
        });
    }
}
exports.default = Budget;
