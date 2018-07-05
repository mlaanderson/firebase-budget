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

        // prepare the changes
        changes = {
            items: [{
                action: transaction.id ? "change" : "create",
                type: "Recurring",
                initial: initial,
                final: transaction
            }]
        };

        let date = Date.periodCalc(this.config.start, this.config.length).toFbString();
         
        if (date < this.transactions.Start) {
            date = this.transactions.Start;
        }

        if (transaction.id) {
            initial = await this.Recurrings.load(transaction.id);
            //  update the existing transactions which depend on this
            let recurrings = await this.transactions.getRecurring(transaction.id);

            // push the transactions which will be deleted into the change history
            // whichever is newer
            for (let k in recurrings) {
                if (recurrings[k].date >= date) {
                    changes.items.push({
                        action: "delete",
                        type: "Transaction",
                        final: recurrings[k]
                    });
                }
            }
        }

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
            let recurrings = await this.transactions.getRecurring(transaction.id);

            if (date < this.transactions.Start) {
                date = this.transactions.Start;
            }

            // setup the history to show linked transactions after this period or today's period
            // whichever is newer being deleted
            for (let k in recurrings) {
                if (recurrings[k].date >= date) {
                    changes.items.push({
                        action: "delete",
                        type: "Transaction",
                        final: recurrings[k]
                    });
                }
            }

            transaction.delete = date;
            await this.Recurrings.save(transaction);
            
            this.history.push(changes);
        }
        return transaction.id;
    }
}