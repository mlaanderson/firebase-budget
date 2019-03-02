import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import Events from "./events";
import Config from "./config";
import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";
import Transactions from "./transactions";
import RecurringTransactions from "./recurringtransactions";
import EditHistory from "../models/history";
import HistoryManager from "./historymanager";

import "../lib/date.ext";

interface Period {
    start: string;
    end: string;
}


export default class Budget extends Events {
    private root: firebase.database.Reference;
    private account: firebase.database.Reference;
    private transactions: Transactions;
    private config: Config;
    private recurring: RecurringTransactions;
    private history: HistoryManager;

    private period: Period;
    private isReady: boolean = false;
    private readyResolver: (value?: boolean | PromiseLike<boolean>) => void;
    private readyPromise: Promise<boolean>;

    constructor(reference: firebase.database.Reference) {
        super();

        this.root = reference;
        this.config = new Config(reference);

        this.root.child('name').once('value').then((snap) => {
            console.log('Running on:', snap.val().toString());
        });

        this.config.read().then(() => {

            this.root.child('accounts').orderByChild('name').startAt('Primary').endAt('Primary').once('child_added').then((snap) => {
                this.account = snap.ref;
                this.transactions = new Transactions(this.account.child('transactions'));
                this.recurring = new RecurringTransactions(this.account.child('recurring'));

                this.history = new HistoryManager(this.transactions, this.recurring);
                this.history.on('change', () => {
                    this.emitAsync('history_change');
                });
               
                this.emitAsync("config_read");
            });
        });

        this.readyPromise = new Promise<boolean>((resolve, reject) => {
            this.readyResolver = resolve;
        });
    }

    public get CanUndo() : boolean {
        return this.history && this.history.canUndo;
    }

    public get CanRedo() : boolean {
        return this.history && this.history.canRedo;
    }

    public async Undo() {
        return await this.history.undo();
    }

    public async Redo() {
        return await this.history.redo();
    }

    public get Transactions() : Transactions {
        return this.transactions;
    }

    public get Recurrings() : RecurringTransactions {
        return this.recurring;
    }

    public get Config() : Config {
        return this.config;
    }

    public get Start() : string {
        return this.transactions.Start;
    }

    public get End() : string {
        return this.transactions.End;
    }

    public ready() {
        return this.readyPromise;
    }

    public async gotoDate(date: string | Date) {  
        this.period = this.config.calculatePeriod(date);
        await this.transactions.loadPeriod(this.period.start, this.period.end);

        if (this.isReady === false) {
            this.isReady = true;
            this.readyResolver(true);
        }

        this.emitAsync('loadperiod', this.transactions.Records, this);
    }

    public async getBackup() : Promise<Object> {
        let snapshot = await this.root.once('value');
        return snapshot.val();
    }

    public async saveTransaction(transaction: Transaction) : Promise<string> {
        let initial = transaction.id ? await this.transactions.load(transaction.id) : null;

        let change: EditHistory = {
            items: [{
                action: transaction.id ? "change" : "create",
                type: "Transaction",
                initial: initial,
                final: transaction
            }]
        };

        let id = await this.Transactions.save(transaction);

        change.items[0].final.id = id;

        this.history.push(change);

        return id;
    }

    public async removeTransaction(transaction: Transaction | string) : Promise<string> {
        if (typeof transaction === "string") {
            transaction = await this.transactions.load(transaction);
        }
        let id = await this.Transactions.remove(transaction);

        this.history.push({
            items: [{
                action: "delete",
                type: "Transaction",
                final: transaction
            }]
        })

        return id;
    }

    public async saveRecurring(transaction: RecurringTransaction) : Promise<string> {
        let changes: EditHistory;
        let initial: RecurringTransaction = null;

        let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
         
        if (date < this.transactions.Start) {
            date = this.transactions.Start;
        }

        if (transaction.id) {
            initial = await this.Recurrings.load(transaction.id);
            initial.active = date;
        }

        // prepare the changes
        changes = {
            items: [{
                action: transaction.id ? "change" : "create",
                type: "Recurring",
                initial: initial,
                final: transaction
            }]
        };

        // Update the transaction - setting the active key makes 
        // all the linked creating/deleting happen on the server
        transaction.active = date;
        let id = await this.Recurrings.save(transaction);

        changes.items[0].final.id = id;

        this.history.push(changes);
        return id;
    }

    public async removeRecurring(transaction: RecurringTransaction | string) : Promise<string> {
        if (typeof transaction === "string") {
            transaction = await this.recurring.load(transaction);
        }

        let changes : EditHistory = {
            items: [{
                action: "delete",
                type: "Recurring",
                final: transaction
            }]
        };

        if (transaction.id) {
            let date = Date.periodCalc(this.config.start, this.config.length).toFbString();

            if (date < this.transactions.Start) {
                date = this.transactions.Start;
            }

            transaction.delete = date;
            await this.Recurrings.save(transaction);
            
            this.history.push(changes);
        }
        return transaction.id;
    }

    public rollUpTo(date: string) : Promise<any> {
        return new Promise(async (resolve, reject) => {

            let oldTransactions = (await this.account.child('transactions').orderByChild('date').startAt(this.config.start).endAt(date).once('value')).val() as RecordMap<Transaction>;

            let rolledTransactions : RecordMap<RecordMap<Transaction>> = {};
            for (let key in oldTransactions) {
                let old = oldTransactions[key];

                if (rolledTransactions[old.category] == null) {
                    rolledTransactions[old.category] = {};
                }

                if (rolledTransactions[old.category][old.name] == null) {
                    rolledTransactions[old.category][old.name] = old;
                    rolledTransactions[old.category][old.name].date = date;
                } else {
                    rolledTransactions[old.category][old.name].amount += old.amount;
                }
            }

            let promises: Array<Promise<any>> = [];

            for (let key in oldTransactions) {
                promises.push(this.account.child('transactions').child(key).remove());
            }

            for (let category in rolledTransactions) {
                for (let name in rolledTransactions[category]) {
                    promises.push(new Promise((resolve, reject) => {
                        this.account.child('transactions').push(rolledTransactions[category][name]).then(() => {
                            resolve();
                        });
                    }));
                }
            }

            await Promise.all(promises);
            resolve();
        });
    }
}