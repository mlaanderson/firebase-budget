import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import Events from "./events";
import Config from "./config";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";
import Transactions from "./transactions";
import RecurringTransactions from "./recurringtransactions";
import EditHistory from "../models/history";
import HistoryManager from "./historymanager";

interface Period {
    start: string;
    end: string;
}


export default class Budget extends Events {
    private name: string;
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
            this.name = snap.val().toString();
            console.log('Running on:', this.name);
        });

        this.config.read().then(() => {

            this.root.child('accounts').orderByChild('name').startAt('Primary').endAt('Primary').once('child_added').then((snap) => {
                this.account = snap.ref;
                this.transactions = new Transactions(this.account.child('transactions'), this.config);
                this.recurring = new RecurringTransactions(this.account.child('recurring'));

                this.history = new HistoryManager(this.transactions, this.recurring);
                this.history.on('change', () => {
                    this.emitAsync('history_change');
                });


                // start at the current period
                // this.gotoDate(Date.today());

                // assign listeners
                this.ready().then(() => {

                    this.recurring.on('child_saved', this.recurring_OnSave.bind(this));
                    this.recurring.on('child_before_removed', this.recurring_OnRemove.bind(this));

                    this.transactions.on('added', this.transaction_OnAdded.bind(this));
                    this.transactions.on('addedinperiod', this.transaction_OnAddedInPeriod.bind(this));
                    this.transactions.on('addedbeforeperiod', this.transaction_OnAddedBeforePeriod.bind(this));
                    
                    this.transactions.on('changed', this.transaction_OnChanged.bind(this));

                    this.transactions.on('removed', this.transaction_OnRemoved.bind(this));
                    this.transactions.on('removedinperiod', this.transaction_OnRemovedInPeriod.bind(this));
                    this.transactions.on('removedbeforeperiod', this.transaction_OnRemovedBeforePeriod.bind(this));

                });
                
                this.emitAsync("config_read");
            });
        });

        this.readyPromise = new Promise<boolean>((resolve, reject) => {
            this.readyResolver = resolve;
        });
    }

    private async transaction_OnAdded(transaction: Transaction) {
        this.emit('transactionadded', transaction, this);
    }

    private async transaction_OnAddedInPeriod(transaction: Transaction) {
        this.emit('transactionaddedinperiod', transaction, this);
    }

    private async transaction_OnAddedBeforePeriod(transaction: Transaction) {
        this.emit('transactionaddedbeforeperiod', transaction, this);
    }

    private async transaction_OnChanged(transaction: Transaction) {
        this.emit('transactionchanged', transaction, this);
    }

    private async transaction_OnRemoved(transaction: Transaction) {
        this.emit('transactionremoved', transaction, this);
    }

    private async transaction_OnRemovedInPeriod(transaction: Transaction) {
        this.emit('transactionremovedinperiod', transaction, this);
    }

    private async transaction_OnRemovedBeforePeriod(transaction: Transaction) {
        this.emit('transactionremovedbeforeperiod', transaction, this);
    }

    private async recurring_OnRemove(id: string) {
        
    }

    private async recurring_OnSave(transaction: RecurringTransaction) {  
       
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

    public ready() {
        return this.readyPromise;
    }

    public async gotoDate(date: string | Date) {
        this.period = this.config.calculatePeriod(date);
        await this.transactions.loadPeriod(this.period.start, this.period.end);

        this.emitAsync('loadperiod', this.transactions.Records, this);

        if (this.isReady === false) {
            this.isReady = true;
            this.readyResolver(true);
        }
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

        if (transaction.id) {
            initial = await this.Recurrings.load(transaction.id);
        }

        changes = {
            items: [{
                action: transaction.id ? "change" : "create",
                type: "Recurring",
                initial: initial,
                final: transaction
            }]
        };

        let id = await this.Recurrings.save(transaction);

        changes.items[0].final.id = id;

         // update the existing transactions which depend on this
         let recurrings = await this.transactions.getRecurring(transaction.id);
         let promises = new Array<Promise<string>>();
         let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
         
         if (date < this.transactions.Start) {
             date = this.transactions.Start;
         }
 
         // delete linked transactions after this period or today's period
         // whichever is newer
         for (let k in recurrings) {
             if (recurrings[k].date >= date) {
                changes.items.push({
                    action: "delete",
                    type: "Transaction",
                    final: recurrings[k]
                });
                promises.push(this.transactions.remove(k));
             }
         }
 
         await Promise.all(promises);
         promises = [];
 
         // insert new transactions according to the schedule
         for (let tDate = Date.parseFb(transaction.start); tDate.le(transaction.end); tDate = tDate.add(transaction.period) as Date) {
             if (tDate.toFbString() >= date) {
                 let promise = this.transactions.save({
                    amount: transaction.amount,
                    cash: transaction.cash,
                    category: transaction.category,
                    date: tDate.toFbString(),
                    name: transaction.name,
                    note: transaction.note,
                    recurring: transaction.id,
                    transfer: transaction.transfer
                 }).then(s => {
                     // insert the change into history
                    changes.items.push({
                        action: "create",
                        type: "Transaction",
                        final: {
                            id: s,
                            amount: transaction.amount,
                            cash: transaction.cash,
                            category: transaction.category,
                            date: tDate.toFbString(),
                            name: transaction.name,
                            note: transaction.note,
                            recurring: transaction.id,
                            transfer: transaction.transfer
                         }
                    });
                    return s;
                 });
                 promises.push(promise);
             }
         }
 
         await Promise.all(promises);

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

        let id = await this.Recurrings.remove(transaction);

        let promises = new Array<Promise<string>>();
        let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
        let recurrings = await this.transactions.getRecurring(id);

        if (date < this.transactions.Start) {
            date = this.transactions.Start;
        }

        // delete linked transactions after this period or today's period
        // whichever is newer
        for (let k in recurrings) {
            if (recurrings[k].date >= date) {
                changes.items.push({
                    action: "delete",
                    type: "Transaction",
                    final: recurrings[k]
                });
                promises.push(this.transactions.remove(k));
            }
        }

        await Promise.all(promises);   
        
        this.history.push(changes);

        return id;
    }
}