/**
 * Handles transaction data interface
 */

import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import { Records, firebase } from "./records";
import Config from "./config";

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
    static Save = 'saved';
    static SavedInPeriod = 'savedinperiod';
    static SavedBeforePeriod = 'savedbeforeperiod';
    static SavedAfterPeriod = 'savedafterperiod';
}

export default class Transactions extends Records<Transaction> {
    private records: RecordMap<Transaction> = {};
    private transactionList: Array<Transaction>;
    private periodStart: string;
    private periodEnd: string;
    private config: Config;

    constructor(reference: firebase.database.Reference, config: Config) {
        super(reference); 
        this.config = config;
    }

    protected sanitizeAfterRead(transaction: Transaction) : Transaction {
        transaction.cash = transaction.cash || false;
        transaction.check = transaction.check || null;
        transaction.note = transaction.note || undefined;
        transaction.paid = transaction.paid || false;
        transaction.recurring = transaction.recurring || null;
        transaction.transfer = transaction.transfer || false;

        return transaction;
    }

    protected sanitizeBeforeWrite(transaction: Transaction) : Transaction {
        transaction.cash = transaction.cash? transaction.cash : null;
        transaction.check = transaction.check === undefined || transaction.check === "" ? null : transaction.check;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.paid = transaction.paid ? transaction.paid : null;
        transaction.recurring = transaction.recurring === undefined || transaction.recurring === "" ? null : transaction.recurring;
        transaction.transfer = transaction.transfer? transaction.transfer : null;

        return transaction;
    }

    protected async onChildAdded(transaction: Transaction) {
        if (!this.periodStart || !this.periodEnd) return;

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            // add the transaction to the local cache
            this.records[transaction.id] = transaction;
            this.populateTransactionList();
            
            this.emitAsync(TransactonEvents.AddedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            this.emitAsync(TransactonEvents.AddedBeforePeriod, transaction, this);
        } else {
            this.emitAsync(TransactonEvents.AddedAfterPeriod, transaction, this);
        }
        this.emitAsync(TransactonEvents.Added, transaction, this);
    }

    protected async onChildChanged(transaction: Transaction) {
        if (!this.periodStart || !this.periodEnd) return;

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            // update the transaction in the local cache
            this.records[transaction.id] = transaction;
            this.populateTransactionList();

            this.emitAsync(TransactonEvents.ChangedInPeriod, transaction, this);
        } else { 
            // remove the transaction from the local cache
            if (transaction.id in this.records) {
                delete this.records[transaction.id];
                this.populateTransactionList();
            }            
            
            if (transaction.date < this.periodStart) {
                // add this transaction to the total
                this.emitAsync(TransactonEvents.ChangedBeforePeriod, transaction, this);
            } else {
                this.emitAsync(TransactonEvents.ChangedAfterPeriod, transaction, this);
            }
        }
        this.emitAsync(TransactonEvents.Changed, transaction, this);
    }

    protected async onChildRemoved(transaction: Transaction) {
        if (!this.periodStart || !this.periodEnd) return;

        // remove the transaction from the local cache
        if (transaction.id in this.records) {
            delete this.records[transaction.id];
            this.populateTransactionList();
        }   

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            this.emitAsync(TransactonEvents.RemovedInPeriod, transaction, this);
        } else if (transaction.date < this.periodStart) {
            this.emitAsync(TransactonEvents.RemovedBeforePeriod, transaction, this);
        } else {
            this.emitAsync(TransactonEvents.RemovedAfterPeriod, transaction, this);
        }
        this.emitAsync(TransactonEvents.Removed, transaction, this);
    }

    protected async onChildSaved(current: Transaction, original: Transaction) {
        if (!this.periodStart || !this.periodEnd) return;

        if (this.periodStart <= current.date && current.date <= this.periodEnd) {
            this.records[current.id] = current;
        } else {
            delete this.records[current.id];
        }
    }

    private transactionSorter(a: Transaction, b: Transaction) {
        let cat1 = this.config.categories.indexOf(a.category);
        let cat2 = this.config.categories.indexOf(b.category);

        if (cat1 != cat2) return cat1 - cat2;

        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    }

    private populateTransactionList() {
        let list = new Array<Transaction>();

        
        for (let k in this.records) {
            list.push(this.records[k]);
        }

        this.transactionList = list.sort(this.transactionSorter.bind(this));
    }

    public get Records() : RecordMap<Transaction> {
        return this.records || {};
    }

    public get List() : Array<Transaction> {
        return this.transactionList;
    }

    public get Start() : string {
        return this.periodStart;
    }

    public get End() : string {
        return this.periodEnd;
    }

    public async loadPeriod(start: string, end: string) : Promise<RecordMap<Transaction>> {
        this.periodStart = start;
        this.periodEnd = end;

        this.records = await this.loadRecordsByChild('date', start, end);
        this.populateTransactionList();
        await this.getTotal();

        return this.records;
    }

    public async getRecurring(recurringId: string) : Promise<RecordMap<Transaction>> {
        // gets the existing transactions linked with the recurring
        return await this.loadRecordsByChild('recurring', recurringId, recurringId);
    }

    public async getTotal() : Promise<number> {
        if (!this.periodStart || !this.periodEnd) return Number.NaN;

        let records = await this.loadRecordsByChild('date', null, this.periodEnd);
        let periodTotal = 0;

        for (let key in records) {
            periodTotal += records[key].amount;
        }

        return periodTotal;
    }

    public async search(search: string | RegExp, searchName: boolean = true, searchCategory: boolean = false) : Promise<Transaction[]> {
        let rgSearch : RegExp;
        if (typeof search === "string") {
            rgSearch = new RegExp(search, "i");
        } else {
            rgSearch = search as RegExp;
        }

        let records = this.convertToArray(await this.loadRecords());

        let result = records.filter((transaction) => {
            if (searchName && rgSearch.test(transaction.name)) return true;
            if (searchCategory && rgSearch.test(transaction.category)) return true;
            return false;
        });

        return result;

    }
}
