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
    amount : number;
    cash? : boolean;
    category : string;
    check? : string;
    checkLink? : string;
    date : string;
    name : string;
    note? : string;
    paid?: boolean;
    recurring? : string;
    transfer? : boolean;
}

interface TransactionMap extends RecordMap<Transaction> {}

export default class Transactions extends Records<Transaction> {
    records: TransactionMap = {};
    periodStart: string;
    periodEnd: string;
    periodTotal: number = 0;

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
    
    off(event: 'added' | 'addedinperiod' | 'addedbeforeperiod' | 'addedafterperiod' | 'changed' | 'changedinperiod' | 'changedbeforeperiod' | 'changedafterperiod' | 'removed' | 'removedinperiod' | 'removedbeforeperiod' | 'removedafterperiod', 
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
            // add the transaction to the local cache
            this.records[transaction.id] = transaction;
            
            // add this transaction to the total
            this.periodTotal += transaction.amount;

            this.emitAsync(TransactonEvents.AddedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            // add this transaction to the total
            this.periodTotal += transaction.amount;

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
            // update the transaction in the local cache
            this.records[transaction.id] = transaction;

            // add this transaction to the total
            this.periodTotal += transaction.amount;

            this.emitAsync(TransactonEvents.ChangedInPeriod, transaction, this);
        } else { 
            // remove the transaction from the local cache
            if (transaction.id in this.records) {
                delete this.records[transaction.id];
            }            
            
            if (transaction.date < this.periodStart) {
                // add this transaction to the total
                this.periodTotal += transaction.amount;

                this.emitAsync(TransactonEvents.ChangedBeforePeriod, transaction, this);
            } else {
                this.emitAsync(TransactonEvents.ChangedAfterPeriod, transaction, this);
            }
        }
        this.emitAsync(TransactonEvents.Changed, transaction, this);
    }

    async onChildRemoved(snap: firebase.database.DataSnapshot, prevChild?: string) {
        if (!this.periodStart || !this.periodEnd) return;

        let transaction = this.sanitizeAfterRead(snap.val() as Transaction);
        // remove the transaction from the local cache
        if (transaction.id in this.records) {
            delete this.records[transaction.id];
        }   

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            // subtract this transaction from the total
            this.periodTotal -= transaction.amount;

            this.emitAsync(TransactonEvents.RemovedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            // subtract this transaction from the total
            this.periodTotal -= transaction.amount;

            this.emitAsync(TransactonEvents.RemovedBeforePeriod, transaction, this);
        } else {
            this.emitAsync(TransactonEvents.RemovedAfterPeriod, transaction, this);
        }
        this.emitAsync(TransactonEvents.Removed, transaction, this);
    }

    async loadPeriod(start: string, end: string) : Promise<TransactionMap> {
        this.periodStart = start;
        this.periodEnd = end;

        this.records = await this.loadRecordsByChild('date', start, end);
        await this.getTotal();

        return this.records;
    }

    async getTotal() : Promise<number> {
        if (!this.periodStart || !this.periodEnd) return Number.NaN;

        let records = await this.loadRecordsByChild('date', null, this.periodEnd);
        this.periodTotal = 0;

        for (let key in records) {
            this.periodTotal += records[key].amount;
        }

        return this.periodTotal;
    }

    async save(record: Transaction) {
        if (this.periodEnd && record.id) {
            // find the current transaction to see if we need to update the total
            let oldrecord = await this.load(record.id);
            if (oldrecord && oldrecord.date <= this.periodEnd) {
                // the old value is included in the total, subtract it
                // the new value will be added in at the change handler
                this.periodTotal -= oldrecord.amount;
            }
        }
        return await super.save(record);
    }

    get Records() : TransactionMap {
        return this.records || {};
    }

    get Total() : number {
        return this.periodTotal;
    }
}