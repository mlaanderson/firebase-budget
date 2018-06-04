"use strict";
/**
 * Handles transaction data interface
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const records_1 = require("./records");
class TransactonEvents {
}
TransactonEvents.Added = 'added';
TransactonEvents.AddedInPeriod = 'addedinperiod';
TransactonEvents.AddedBeforePeriod = 'addedbeforeperiod';
TransactonEvents.AddedAfterPeriod = 'addedafterperiod';
TransactonEvents.Changed = 'changed';
TransactonEvents.ChangedInPeriod = 'changedinperiod';
TransactonEvents.ChangedBeforePeriod = 'changedbeforeperiod';
TransactonEvents.ChangedAfterPeriod = 'changedafterperiod';
TransactonEvents.Removed = 'removed';
TransactonEvents.RemovedInPeriod = 'removedinperiod';
TransactonEvents.RemovedBeforePeriod = 'removedbeforeperiod';
TransactonEvents.RemovedAfterPeriod = 'removedafterperiod';
TransactonEvents.Save = 'saved';
TransactonEvents.SavedInPeriod = 'savedinperiod';
TransactonEvents.SavedBeforePeriod = 'savedbeforeperiod';
TransactonEvents.SavedAfterPeriod = 'savedafterperiod';
class Transactions extends records_1.Records {
    constructor(reference, config) {
        super(reference);
        this.records = {};
        this.periodTotal = 0;
        this.config = config;
    }
    sanitizeAfterRead(transaction) {
        transaction.cash = transaction.cash || false;
        transaction.check = transaction.check || null;
        transaction.checkLink = transaction.checkLink || null;
        transaction.note = transaction.note || null;
        transaction.paid = transaction.paid || false;
        transaction.recurring = transaction.recurring || null;
        transaction.transfer = transaction.transfer || false;
        return transaction;
    }
    sanitizeBeforeWrite(transaction) {
        transaction.cash = transaction.cash ? transaction.cash : null;
        transaction.check = transaction.check === undefined || transaction.check === "" ? null : transaction.check;
        transaction.checkLink = transaction.checkLink === undefined || transaction.checkLink === "" ? null : transaction.checkLink;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.paid = transaction.paid ? transaction.paid : null;
        transaction.recurring = transaction.recurring === undefined || transaction.recurring === "" ? null : transaction.recurring;
        transaction.transfer = transaction.transfer ? transaction.transfer : null;
        return transaction;
    }
    onChildAdded(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return;
            if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
                // add the transaction to the local cache
                this.records[transaction.id] = transaction;
                this.populateTransactionList();
                // add this transaction to the total
                // this.periodTotal += transaction.amount;
                this.emitAsync(TransactonEvents.AddedInPeriod, transaction, this);
            }
            else if (transaction.date < this.periodStart) {
                // add this transaction to the total
                this.periodTotal += transaction.amount;
                this.emitAsync(TransactonEvents.AddedBeforePeriod, transaction, this);
            }
            else {
                this.emitAsync(TransactonEvents.AddedAfterPeriod, transaction, this);
            }
            this.emitAsync(TransactonEvents.Added, transaction, this);
        });
    }
    onChildChanged(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return;
            if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
                // update the transaction in the local cache
                this.records[transaction.id] = transaction;
                this.populateTransactionList();
                // add this transaction to the total
                this.periodTotal += transaction.amount;
                this.emitAsync(TransactonEvents.ChangedInPeriod, transaction, this);
            }
            else {
                // remove the transaction from the local cache
                if (transaction.id in this.records) {
                    delete this.records[transaction.id];
                    this.populateTransactionList();
                }
                if (transaction.date < this.periodStart) {
                    // add this transaction to the total
                    this.periodTotal += transaction.amount;
                    this.emitAsync(TransactonEvents.ChangedBeforePeriod, transaction, this);
                }
                else {
                    this.emitAsync(TransactonEvents.ChangedAfterPeriod, transaction, this);
                }
            }
            this.emitAsync(TransactonEvents.Changed, transaction, this);
        });
    }
    onChildRemoved(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return;
            // remove the transaction from the local cache
            if (transaction.id in this.records) {
                delete this.records[transaction.id];
                this.populateTransactionList();
            }
            if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
                // subtract this transaction from the total
                this.periodTotal -= transaction.amount;
                this.emitAsync(TransactonEvents.RemovedInPeriod, transaction, this);
            }
            else if (transaction.date < this.periodStart) {
                // subtract this transaction from the total
                this.periodTotal -= transaction.amount;
                this.emitAsync(TransactonEvents.RemovedBeforePeriod, transaction, this);
            }
            else {
                this.emitAsync(TransactonEvents.RemovedAfterPeriod, transaction, this);
            }
            this.emitAsync(TransactonEvents.Removed, transaction, this);
        });
    }
    onChildSaved(current, original) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return;
            if (this.periodStart <= current.date && current.date <= this.periodEnd) {
                this.records[current.id] = current;
            }
            else {
                delete this.records[current.id];
            }
        });
    }
    transactionSorter(a, b) {
        let cat1 = this.config.categories.indexOf(a.category);
        let cat2 = this.config.categories.indexOf(b.category);
        if (cat1 != cat2)
            return cat1 - cat2;
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }
    populateTransactionList() {
        let list = new Array();
        for (let k in this.records) {
            list.push(this.records[k]);
        }
        this.transactionList = list.sort(this.transactionSorter.bind(this));
    }
    get Records() {
        return this.records || {};
    }
    get List() {
        return this.transactionList;
    }
    get Total() {
        return this.periodTotal;
    }
    get Start() {
        return this.periodStart;
    }
    get End() {
        return this.periodEnd;
    }
    loadPeriod(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            this.periodStart = start;
            this.periodEnd = end;
            this.records = yield this.loadRecordsByChild('date', start, end);
            this.populateTransactionList();
            yield this.getTotal();
            return this.records;
        });
    }
    getRecurring(recurringId) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the existing transactions linked with the recurring
            return yield this.loadRecordsByChild('recurring', recurringId, recurringId);
        });
    }
    getTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return Number.NaN;
            let records = yield this.loadRecordsByChild('date', null, this.periodEnd);
            this.periodTotal = 0;
            for (let key in records) {
                this.periodTotal += records[key].amount;
            }
            return this.periodTotal;
        });
    }
    save(record) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            if (this.periodEnd && record.id) {
                // find the current transaction to see if we need to update the total
                let oldrecord = yield this.load(record.id);
                if (oldrecord && oldrecord.date <= this.periodEnd) {
                    // the old value is included in the total, subtract it
                    // the new value will be added in at the change handler
                    this.periodTotal -= oldrecord.amount;
                }
            }
            return yield _super("save").call(this, record);
        });
    }
}
exports.default = Transactions;
