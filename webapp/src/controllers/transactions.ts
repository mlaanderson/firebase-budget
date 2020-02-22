/**
 * Handles transaction data interface
 */

import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import { Records, firebase } from "./records";
import Config from "./config";
import Cash from "../models/cash";
import "../lib/number.ext";
import "../lib/math.ext";
import "../lib/string.ext";
import { totalmem } from "os";

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

    constructor(reference: firebase.database.Reference) {
        super(reference); 
    }

    protected sanitizeAfterRead(transaction: Transaction) : Transaction {
        transaction.cash = transaction.cash || false;
        transaction.check = transaction.check || null;
        transaction.note = transaction.note || undefined;
        transaction.paid = transaction.paid || false;
        transaction.scheduled = transaction.scheduled || false;
        transaction.recurring = transaction.recurring || null;
        transaction.transfer = transaction.transfer || false;

        return transaction;
    }

    protected sanitizeBeforeWrite(transaction: Transaction) : Transaction {
        transaction.cash = transaction.cash? transaction.cash : null;
        transaction.check = transaction.check === undefined || transaction.check === "" ? null : transaction.check;
        transaction.note = transaction.note === undefined || transaction.note === "" ? null : transaction.note;
        transaction.paid = transaction.paid ? transaction.paid : null;
        transaction.scheduled = transaction.scheduled ? transaction.scheduled : null;
        transaction.recurring = transaction.recurring === undefined || transaction.recurring === "" ? null : transaction.recurring;
        transaction.transfer = transaction.transfer? transaction.transfer : null;

        return transaction;
    }

    protected async onChildAdded(transaction: Transaction) {
        if (!this.periodStart || !this.periodEnd) return;

        if (this.periodStart <= transaction.date && transaction.date <= this.periodEnd) {
            // add the transaction to the local cache
            if (!this.records) {
                this.records = {};
            }
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

        this.populateTransactionList();
    }

    private populateTransactionList() {
        let list = new Array<Transaction>();

        
        for (let k in this.records) {
            list.push(this.records[k]);
        }

        this.transactionList = list;
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

    public get Cash() : Cash {
        let result = Cash.default();

        for (let transaction of this.transactionList) {
            if (transaction.cash === true && transaction.paid !== true && transaction.amount < 0) {
                result.add(Math.abs(transaction.amount).toCash());
            }
        }

        return result;
    }

    public get Transfer() : number {
        let result = 0;

        for (let transaction of this.transactionList) {
            if (transaction.transfer === true && transaction.paid === false) {
                result -= transaction.amount;
            }
        }

        return result;
    }

    public async getSame(transaction: Transaction) : Promise<Array<Transaction>> {
        let sameNames = await this.loadRecordsByChild('name', transaction.name, transaction.name);
        let sameNameList = this.convertToArray(sameNames);

        return sameNameList.filter((tr) => tr.category === transaction.category);
    }

    public async loadPeriod(start: string, end: string) : Promise<RecordMap<Transaction>> {
        this.periodStart = start;
        this.periodEnd = end;

        this.records = await this.loadRecordsByChild('date', start, end);
        this.populateTransactionList();
        let total = await this.getTotal();
        let balance = await this.getBalance(total);

        this.emitAsync('periodloaded', this.transactionList, total, balance);

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

    public async getBalance(total? : number) : Promise<number> {
        if (!this.periodStart || !this.periodEnd) return Number.NaN;

        total = total || await this.getTotal();
        let balance = total;

        if (this.transactionList === undefined || this.transactionList.length == 0) {
            this.records = await this.loadRecordsByChild('date', this.periodStart, this.periodEnd);
            this.populateTransactionList();
        }

        for (let transaction of this.transactionList) {
            if (transaction.paid !== true) {
                balance -= transaction.amount;
            }
        }

        console.log("Bank:", balance.toCurrency());

        return balance;
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

    public async LoadNames() :  Promise<Array<string>> {
        let records = Object.values(await this.loadRecords());
        let names = Array.from(new Set(records.map(tr => tr.name)));
        names.sort();
        return names;
    }

    private Date2Excel(value: Date | string) : string {
        // format for excel
        let date : Date;

        if (typeof value === "string") {
            date = Date.parseFb(value);
        } else {
            date = value;
        }

        return date.getFullYear().toString().padStart(4, '0') + '/' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
            date.getDate().toString().padStart(2, '0');
    }

    public async getCsv(start?: string, end?: string) : Promise<string> {
        let records = this.convertToArray(await this.loadRecordsByChild('date', start, end));
        let result = `Category,Name,Date,Cash,Transfer,Amount,Paid,Memo`;

        records.sort((a, b) => {
            return Date.parseFb(a.date).getTime() - Date.parseFb(b.date).getTime();
        });

        for (let record of records) {
            result += `\r\n"${record.category.replace('"', '""')}","${record.name.replace('"', '""')}","${this.Date2Excel(record.date)}",${record.cash},${record.transfer},"${record.amount.toCurrency()}",${record.paid},${record.note ? '"' + record.note + '"' : ""}`;
        }

        return result;
    }
}
