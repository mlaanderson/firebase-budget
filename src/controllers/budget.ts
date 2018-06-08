import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import Events from "./events";
import Config from "./config";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";
import Transactions from "./transactions";
import RecurringTransactions from "./recurringtransactions";

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

                // start at the current period
                this.gotoDate(Date.today());

                // assign listeners
                this.recurring.on('child_saved', this.recurring_OnSave.bind(this));

                this.transactions.on('added', this.transaction_OnAdded.bind(this));
                this.transactions.on('addedinperiod', this.transaction_OnAddedInPeriod.bind(this));
                this.transactions.on('addedbeforeperiod', this.transaction_OnAddedBeforePeriod.bind(this));
                
                this.transactions.on('changed', this.transaction_OnChanged.bind(this));

                this.transactions.on('removed', this.transaction_OnRemoved.bind(this));
                this.transactions.on('removedinperiod', this.transaction_OnRemovedInPeriod.bind(this));
                this.transactions.on('removedbeforeperiod', this.transaction_OnRemovedBeforePeriod.bind(this));
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

    private async recurring_OnSave(transaction: RecurringTransaction) { 
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
                promises.push(this.transactions.remove(k));
            }
        }

        await Promise.all(promises);
        promises = [];

        // insert new transactions according to the schedule
        for (let tDate = Date.parseFb(transaction.start); tDate.le(transaction.end); tDate = tDate.add(transaction.period) as Date) {
            if (tDate.toFbString() >= date) {
                promises.push(this.transactions.save({
                    amount: transaction.amount,
                    cash: transaction.cash,
                    category: transaction.category,
                    date: tDate.toFbString(),
                    name: transaction.name,
                    note: transaction.note,
                    recurring: transaction.id,
                    transfer: transaction.transfer
                }));
            }
        }

        await Promise.all(promises);
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
}