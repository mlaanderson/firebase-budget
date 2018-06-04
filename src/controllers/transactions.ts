/**
 * Handles transaction data interface
 */

import { Records, Record, RecordMap, firebase } from "./records";

class TransactonEvents {
    static Added = 'added';
    static AddedInPeriod = 'addedinperiod';
    static AddedBeforePeriod = 'addedbeforeperiod';
    static AddedAfterPeriod = 'addedafterperiod';
    static Changed = 'changed';
    static ChangedInPeriod = 'changedinperiod';
    static ChangedBeforePeriod = 'changedbeforeperiod';
    static ChangedAfterPeriod = 'changedafterperiod';
    static Removed = 'removed';
    static RemovedInPeriod = 'removedinperiod';
    static RemovedBeforePeriod = 'removedbeforeperiod';
    static RemovedAfterPeriod = 'removedafterperiod';
}

interface Transaction extends Record {
    date : string;
    category : string;
    name : string;
    amount : number;
    cash? : boolean;
    paid?: boolean;
    transfer? : boolean;
    note? : string;
    check? : string;
    checkLink? : string;
    recurring? : string;
}

interface TransactionMap extends RecordMap<Transaction> {}

export default class Transactions extends Records<Transaction> {
    records: TransactionMap;
    periodStart: string;
    periodEnd: string;

    constructor(reference: firebase.database.Reference) {
        super(reference); 
    }

    sanitizeAfterRead(transaction: Transaction) : Transaction {
        transaction.cash = transaction.cash || false;
        transaction.check = transaction.check || null;
        transaction.checkLink = transaction.checkLink || null;
        transaction.note = transaction.note || null;
        transaction.paid = transaction.paid || false;
        transaction.recurring = transaction.recurring || null;
        transaction.transfer = transaction.transfer || false;

        return transaction;
    }

    sanitizeBeforeWrite(transaction: Transaction) : Transaction {
        transaction.cash = transaction.cash? transaction.cash : null;
        transaction.check = transaction.check === undefined || transaction.check === "" ? null : transaction.check;
        transaction.checkLink = transaction.checkLink === undefined || transaction.checkLink === "" ? null : transaction.checkLink;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.paid = transaction.paid ? transaction.paid : null;
        transaction.recurring = transaction.recurring === undefined || transaction.recurring === "" ? null : transaction.recurring;
        transaction.transfer = transaction.transfer? transaction.transfer : null;

        return transaction;
    }

    on(event: 'added' | 'addedinperiod' | 'addedbeforeperiod' | 'addedafterperiod' | 'changed' | 'changedinperiod' | 'changedbeforeperiod' | 'changedafterperiod' | 'removed' | 'removedinperiod' | 'removedbeforeperiod' | 'removedafterperiod', 
        handler: (transaction: Transaction, controller: Transactions) => void, context?: any) : Transactions 
    {
        super.on(event, handler, context);
        return this;
    }
    
    onff(event: 'added' | 'addedinperiod' | 'addedbeforeperiod' | 'addedafterperiod' | 'changed' | 'changedinperiod' | 'changedbeforeperiod' | 'changedafterperiod' | 'removed' | 'removedinperiod' | 'removedbeforeperiod' | 'removedafterperiod', 
        handler: (transaction: Transaction, controller: Transactions) => void) : Transactions 
    {
        super.off(event, handler);
        return this;
    }

    once(event: 'added' | 'addedinperiod' | 'addedbeforeperiod' | 'addedafterperiod' | 'changed' | 'changedinperiod' | 'changedbeforeperiod' | 'changedafterperiod' | 'removed' | 'removedinperiod' | 'removedbeforeperiod' | 'removedafterperiod', 
        handler: (transaction: Transaction, controller: Transactions) => void, context?: any) : Transactions 
    {
        super.once(event, handler, context);
        return this;
    }

    async onChildAdded(snap: firebase.database.DataSnapshot, prevChild?: string) {
        if (!this.periodStart || !this.periodEnd) return;

        let transaction = this.sanitizeAfterRead(snap.val() as Transaction);    

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            this.emitAsync(TransactonEvents.AddedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            this.emitAsync(TransactonEvents.AddedBeforePeriod, transaction, this);
        } else {
            this.emitAsync(TransactonEvents.AddedAfterPeriod, transaction, this);
        }
        this.emitAsync(TransactonEvents.Added, transaction, this);
    }

    async onChildChanged(snap: firebase.database.DataSnapshot, prevChild?: string) {
        if (!this.periodStart || !this.periodEnd) return;

        let transaction = this.sanitizeAfterRead(snap.val() as Transaction);

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            this.emitAsync(TransactonEvents.ChangedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            this.emitAsync(TransactonEvents.ChangedBeforePeriod, transaction, this);
        } else {
            this.emitAsync(TransactonEvents.ChangedAfterPeriod, transaction, this);
        }
        this.emitAsync(TransactonEvents.Changed, transaction, this);
    }

    async onChildRemoved(snap: firebase.database.DataSnapshot, prevChild?: string) {
        if (!this.periodStart || !this.periodEnd) return;

        let transaction = this.sanitizeAfterRead(snap.val() as Transaction);

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            this.emitAsync(TransactonEvents.RemovedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            this.emitAsync(TransactonEvents.RemovedBeforePeriod, transaction, this);
        } else {
            this.emitAsync(TransactonEvents.RemovedAfterPeriod, transaction, this);
        }
        this.emitAsync(TransactonEvents.Removed, transaction, this);
    }

    async loadPeriod(start: string, end: string) : Promise<TransactionMap> {
        this.periodStart = start;
        this.periodEnd = end;

        return await this.loadFilterChild('date', start, end);
    }
}