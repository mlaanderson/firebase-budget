"use strict";
/**
 * Handles recurring transaction data interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
const records_1 = require("./records");
class RecurringTransactions extends records_1.Records {
    constructor(reference) {
        super(reference);
    }
    sanitizeAfterRead(transaction) {
        transaction.cash = transaction.cash || false;
        transaction.note = transaction.note || null;
        transaction.transfer = transaction.transfer || false;
        return transaction;
    }
    sanitizeBeforeWrite(transaction) {
        transaction.cash = transaction.cash ? transaction.cash : null;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.transfer = transaction.transfer ? transaction.transfer : null;
        return transaction;
    }
}
exports.default = RecurringTransactions;
