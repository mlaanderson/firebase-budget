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
const cash_1 = require("../models/cash");
require("../lib/number.ext");
require("../lib/math.ext");
require("../lib/string.ext");
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
        this.config = config;
    }
    sanitizeAfterRead(transaction) {
        transaction.cash = transaction.cash || false;
        transaction.check = transaction.check || null;
        transaction.note = transaction.note || undefined;
        transaction.paid = transaction.paid || false;
        transaction.recurring = transaction.recurring || null;
        transaction.transfer = transaction.transfer || false;
        return transaction;
    }
    sanitizeBeforeWrite(transaction) {
        transaction.cash = transaction.cash ? transaction.cash : null;
        transaction.check = transaction.check === undefined || transaction.check === "" ? null : transaction.check;
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
                if (!this.records) {
                    this.records = {};
                }
                this.records[transaction.id] = transaction;
                this.populateTransactionList();
                this.emitAsync(TransactonEvents.AddedInPeriod, transaction, this);
            }
            else if (transaction.date < this.periodStart) {
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
                this.emitAsync(TransactonEvents.RemovedInPeriod, transaction, this);
            }
            else if (transaction.date < this.periodStart) {
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
    get Start() {
        return this.periodStart;
    }
    get End() {
        return this.periodEnd;
    }
    get Cash() {
        let result = cash_1.default.default();
        for (let transaction of this.transactionList) {
            if (transaction.cash === true && transaction.paid === false && transaction.amount < 0) {
                result.add(Math.abs(transaction.amount).toCash());
            }
        }
        return result;
    }
    get Transfer() {
        let result = 0;
        for (let transaction of this.transactionList) {
            if (transaction.transfer === true && transaction.paid === false) {
                result -= transaction.amount;
            }
        }
        return result;
    }
    getSame(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let sameNames = yield this.loadRecordsByChild('name', transaction.name, transaction.name);
            let sameNameList = this.convertToArray(sameNames);
            return sameNameList.filter((tr) => tr.category === transaction.category);
        });
    }
    loadPeriod(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            this.periodStart = start;
            this.periodEnd = end;
            this.records = yield this.loadRecordsByChild('date', start, end);
            this.populateTransactionList();
            let total = yield this.getTotal();
            this.emitAsync('periodloaded', this.transactionList, total);
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
            let periodTotal = 0;
            for (let key in records) {
                periodTotal += records[key].amount;
            }
            return periodTotal;
        });
    }
    search(search, searchName = true, searchCategory = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let rgSearch;
            if (typeof search === "string") {
                rgSearch = new RegExp(search, "i");
            }
            else {
                rgSearch = search;
            }
            let records = this.convertToArray(yield this.loadRecords());
            let result = records.filter((transaction) => {
                if (searchName && rgSearch.test(transaction.name))
                    return true;
                if (searchCategory && rgSearch.test(transaction.category))
                    return true;
                return false;
            });
            return result;
        });
    }
    Date2Excel(value) {
        // format for excel
        let date;
        if (typeof value === "string") {
            date = Date.parseFb(value);
        }
        else {
            date = value;
        }
        return date.getFullYear().toString().padStart(4, '0') + '/' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
            date.getDate().toString().padStart(2, '0') + ' ' +
            date.getHours().toString().padStart(2, '0') + ':' +
            date.getMinutes().toString().padStart(2, '0') + ':' +
            date.getSeconds().toString().padStart(2, '0');
    }
    getCsv(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            let records = this.convertToArray(yield this.loadRecordsByChild('date', start, end));
            let result = `Category,Name,Date,Amount,Memo`;
            records.sort((a, b) => {
                return Date.parseFb(a.date).getTime() - Date.parseFb(b.date).getTime();
            });
            for (let record of records) {
                result += `\r\n"${record.category.replace('"', '""')}","${record.name.replace('"', '""')}","${this.Date2Excel(record.date)}",${record.amount},${record.note ? '"' + record.note + '"' : ""}`;
            }
            return result;
        });
    }
}
exports.default = Transactions;
