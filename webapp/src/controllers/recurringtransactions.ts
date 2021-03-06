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
        if (transaction === null) return null;
        
        transaction.cash = transaction.cash || false;
        transaction.note = transaction.note || null;
        transaction.transfer = transaction.transfer || false;
        transaction.scheduled = transaction.scheduled || false;

        return transaction;
    }

    sanitizeBeforeWrite(transaction: RecurringTransaction) : RecurringTransaction {
        transaction.cash = transaction.cash? transaction.cash : null;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.transfer = transaction.transfer? transaction.transfer : null;
        transaction.scheduled = transaction.scheduled ? transaction.scheduled : null;

        return transaction;
    }
}
