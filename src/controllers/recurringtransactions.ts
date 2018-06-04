/**
 * Handles recurring transaction data interface
 */

import RecurringTransaction from "../models/recurringtransaction";
import { Records, firebase } from "./records";



export default class RecurringTransactions extends Records<RecurringTransaction> {
    constructor(reference: firebase.database.Reference) {
        super(reference); 
    }

    sanitizeAfterRead(transaction: RecurringTransaction) : RecurringTransaction {
        transaction.cash = transaction.cash || false;
        transaction.note = transaction.note || null;
        transaction.transfer = transaction.transfer || false;

        return transaction;
    }

    sanitizeBeforeWrite(transaction: RecurringTransaction) : RecurringTransaction {
        transaction.cash = transaction.cash? transaction.cash : null;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.transfer = transaction.transfer? transaction.transfer : null;

        return transaction;
    }
}
