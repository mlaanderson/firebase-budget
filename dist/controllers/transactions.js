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
var TransactonEvents;
(function (TransactonEvents) {
    TransactonEvents["AddedInPeriod"] = "addedinperiod";
    TransactonEvents["AddedBeforePeriod"] = "addedbeforeperiod";
    TransactonEvents["AddedAfterPeriod"] = "addedafterperiod";
    TransactonEvents["ChangedInPeriod"] = "changedinperiod";
    TransactonEvents["ChangedBeforePeriod"] = "changedbeforeperiod";
    TransactonEvents["ChangedAfterPeriod"] = "changedafterperiod";
    TransactonEvents["RemovedInPeriod"] = "removedinperiod";
    TransactonEvents["RemovedBeforePeriod"] = "removedbeforeperiod";
    TransactonEvents["RemovedAfterPeriod"] = "removedafterperiod";
})(TransactonEvents || (TransactonEvents = {}));
class Transactions extends records_1.Records {
    constructor(reference) {
        super(reference);
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
    onChildAdded(snap, prevChild) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return;
            let transaction = snap.val();
            if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
                this.emitAsync(TransactonEvents.AddedInPeriod, transaction, this);
            }
            else if (transaction.date < this.periodStart) {
                this.emitAsync(TransactonEvents.AddedBeforePeriod, transaction, this);
            }
            else {
                this.emitAsync(TransactonEvents.AddedAfterPeriod, transaction, this);
            }
        });
    }
    onChildChanged(snap, prevChild) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.periodStart || !this.periodEnd)
                return;
            let transaction = snap.val();
        });
    }
    loadPeriod(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            this.periodStart = start;
            this.periodEnd = end;
            return yield this.loadFilterChild('date', start, end);
        });
    }
}
exports.default = Transactions;
