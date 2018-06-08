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
class Budget extends events_1.default {
    constructor(reference) {
        super();
        this.isReady = false;
        this.root = reference;
        this.config = new config_1.default(reference);
        this.root.child('name').once('value').then((snap) => {
            this.name = snap.val().toString();
            console.log('Running on:', this.name);
        });
        this.config.read().then(() => {
            this.root.child('accounts').orderByChild('name').startAt('Primary').endAt('Primary').once('child_added').then((snap) => {
                this.account = snap.ref;
                this.transactions = new transactions_1.default(this.account.child('transactions'), this.config);
                this.recurring = new recurringtransactions_1.default(this.account.child('recurring'));
                // start at the current period
                this.gotoDate(Date.today());
                // assign listeners
                this.recurring.on('child_saved', this.recurring_OnSave.bind(this));
                this.transactions.on('added', this.transaction_OnAdded.bind(this));
                this.transactions.on('addedinperiod', this.transaction_OnAddedInPeriod.bind(this));
                this.transactions.on('addedbeforeperiod', this.transaction_OnAddedBeforePeriod.bind(this));
                this.transactions.on('changed', this.transaction_OnChanged.bind(this));
                this.transactions.on('removed', this.transaction_OnRemoved.bind(this));
                this.transactions.on('removedinperiod', this.transaction_OnRemovedInPeriod.bind(this));
                this.transactions.on('removedbeforeperiod', this.transaction_OnRemovedBeforePeriod.bind(this));
            });
        });
        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolver = resolve;
        });
    }
    transaction_OnAdded(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionadded', transaction, this);
        });
    }
    transaction_OnAddedInPeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionaddedinperiod', transaction, this);
        });
    }
    transaction_OnAddedBeforePeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionaddedbeforeperiod', transaction, this);
        });
    }
    transaction_OnChanged(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionchanged', transaction, this);
        });
    }
    transaction_OnRemoved(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionremoved', transaction, this);
        });
    }
    transaction_OnRemovedInPeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionremovedinperiod', transaction, this);
        });
    }
    transaction_OnRemovedBeforePeriod(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('transactionremovedbeforeperiod', transaction, this);
        });
    }
    recurring_OnSave(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    promises.push(this.transactions.remove(k));
                }
            }
            yield Promise.all(promises);
            promises = [];
            // insert new transactions according to the schedule
            for (let tDate = Date.parseFb(transaction.start); tDate.le(transaction.end); tDate = tDate.add(transaction.period)) {
                if (tDate.toFbString() >= date) {
                    promises.push(this.transactions.save({
                        amount: transaction.amount,
                        cash: transaction.cash,
                        category: transaction.category,
                        date: tDate.toFbString(),
                        name: transaction.name,
                        note: transaction.note,
                        recurring: transaction.id,
                        transfer: transaction.transfer
                    }));
                }
            }
            yield Promise.all(promises);
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
}
exports.default = Budget;
