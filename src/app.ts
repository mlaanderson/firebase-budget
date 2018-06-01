import Transaction, { TransactionStructure } from "./types/transaction";
import RecurringTransaction from "./types/recurringtransaction";
import Check from "./types/check";
import Timespan from "./lib/timespan";
import Form from "./form";
import * as firebase from "firebase";
import TypeMap from "./types/maps";
import "./lib/math.ext";
import "./lib/date.ext";

export class Config {
    static CATEGORIES : Array<string> = [
        "Income",
        "Charity",
        "Saving",
        "Housing",
        "Utilities",
        "Food",
        "Clothing",
        "Transportation",
        "Medical",
        "Insurance",
        "Personal",
        "Recreation",
        "Debt"
    ];

    static PERIOD_START : string = "2016-06-24";
    static PERIOD_LENGTH : string = "2 weeks";

    static async read(root: firebase.database.Reference) {
        let snap : firebase.database.DataSnapshot;
        let config : any;

        snap = await root.child('config').once('value');
        config = snap.val();

        if (config == null) {
            // set the defaults to the account
            root.child('config/categories').set(Config.CATEGORIES);
            root.child('config/periods').set({
                length: '2 weeks',
                start: Date.today().toFbString()
            });
            root.child('accounts').push({ name: 'Primary' });
        } else {
            Config.CATEGORIES = config.categories;
            if (config.periods !== undefined) {
                Config.PERIOD_START = config.periods.start || "2016-06-24";
                Config.PERIOD_LENGTH = config.periods.length || "2 weeks";
            }
        }
    }

    static async write(root: firebase.database.Reference) {
        await root.child('config/categories').set(Config.CATEGORIES);
        await root.child('config/periods').set({
            length: Config.PERIOD_LENGTH,
            start: Config.PERIOD_START
        });
    }
}

export default class Application {
    m_app: firebase.app.App;
    m_today: Date;
    m_form : Form;
    m_primaryAccount: firebase.database.Reference;
    m_periodStart : string;
    m_periodEnd : string;
    m_loading : boolean = true;

    constructor() {
        this.m_form = new Form(this);
        this.m_today = Date.today();

        this.m_app = firebase.initializeApp({
            apiKey: "AIzaSyDhs0mPVlovk6JHnEdv6HeU2jy3M8VRoSk",
            authDomain: "budget-dacac.firebaseapp.com",
            databaseURL: "https://budget-dacac.firebaseio.com",
            storageBucket: "budget-dacac.appspot.com"
        });

        this.m_app.auth().onAuthStateChanged(this.app_AuthStateChanged.bind(this));
    }

    async app_AuthStateChanged(user: firebase.User) { 
        if (user === null) { 
            this.m_primaryAccount = null;
            this.m_form.clear();
        } else { 
            this.m_form.loading();
            await Config.read(this.root);
            this.m_form.onConfigLoaded();
            let snap : firebase.database.DataSnapshot;

            snap = await this.root.child('accounts').orderByChild('name').equalTo('Primary').once('child_added');
            if (snap.val() !== null) {
                this.m_primaryAccount = snap.ref;
            } else {
                this.m_primaryAccount = this.root.child('accounts').push();
                this.m_primaryAccount.set({ name: 'Primary' });
            }

            // setup the transaction listeners
            this.transactions.on('child_changed', this.onTransactionChanged.bind(this));
            this.transactions.on('child_added', this.onTransactionAdded.bind(this));
            this.transactions.on('child_removed', this.onTransactionRemoved.bind(this));

            // show the screens
            let transactions = await this.selectPeriod();
            this.m_form.updateTransactions(transactions);
        }
    }

    async login(username: string, password: string) : Promise<firebase.auth.UserCredential> {
        let credentials;
        try {
            credentials = await this.m_app.auth().signInWithEmailAndPassword(username, password);
        } catch (error) {
            throw error;
        }
        return credentials;
    }

    async onTransactionChanged(snap: firebase.database.DataSnapshot) {
        if (this.m_loading == true) return;
        
        let transaction = snap.val() as TransactionStructure;
        transaction.id = snap.key;

        if (this.m_periodStart <= transaction.date && transaction.date <= this.m_periodEnd) {
            // update the transaction
            this.m_form.updateTransaction(transaction);
        }

        this.m_form.updatePreview(transaction);
        this.m_form.updateChart();

        if (transaction.date <= this.m_periodEnd) {
            // update the total
            let sum = await this.getPeriodSum();
            this.m_form.updateTotal(sum);
        }
    }

    async onTransactionAdded(snap: firebase.database.DataSnapshot) {
        if (this.m_loading == true) return;
        
        let transaction = snap.val() as TransactionStructure;
        transaction.id = snap.key;

        if (this.m_periodStart <= transaction.date && transaction.date <= this.m_periodEnd) {
            // update the transaction
            this.m_form.updateTransaction(transaction);
        }

        this.m_form.updatePreview(transaction);
        this.m_form.updateChart();

        if (transaction.date <= this.m_periodEnd) {
            // update the total
            let sum = await this.getPeriodSum();
            this.m_form.updateTotal(sum);
        }
    }

    async onTransactionRemoved(snap: firebase.database.DataSnapshot) {
        if (this.m_loading == true) return;

        this.m_form.removeTransaction(snap.key);
        this.m_form.updateTotal(await this.getPeriodSum());
        this.m_form.updateChart();
    }

    get root() {
        if (this.m_app.auth().currentUser == null) {
            throw new Error("Not signed in");
        }
        return this.m_app.database().ref().child(this.m_app.auth().currentUser.uid);
    }

    /** Used in some templates */
    get Categories() {
        return Config.CATEGORIES;
    }

    get transactions() {
        return this.m_primaryAccount.child('transactions');
    }

    get recurring() {
        return this.m_primaryAccount.child('recurring');
    }

    async signout() {
        await this.m_app.auth().signOut();
    }

    async getTransaction(key: string) : Promise<TransactionStructure> {
        let tsnap = await this.transactions.child(key).once('value');
        let item = tsnap.val() as TransactionStructure;

        item.id = key;

        return item;
    }

    async saveTransaction(transaction: TransactionStructure) {
        let id: string;

        // null out the empty strings in check, checkLink and note
        transaction.check = transaction.check || null;
        transaction.checkLink = transaction.checkLink || null;
        transaction.note = transaction.note || null;
        transaction.cash = transaction.cash || false;
        transaction.paid = transaction.paid || false;
        transaction.transfer = transaction.transfer || false;
        transaction.recurring = transaction.recurring || null;

        if (transaction.id) {
            // existing transaction, update it
            id = transaction.id;

            // delete the id property, it doesn't get saved
            delete transaction.id;

            await this.transactions.child(id).set(transaction);
        } else {
            // new transaction, save it
            let ref: firebase.database.ThenableReference = await this.transactions.push(transaction);
            transaction.id = ref.key;
        }
    }

    async deleteTransaction(key: string) {
        await this.transactions.child(key).remove();
    }

    async getRecurringTransaction(key: string) : Promise<RecurringTransaction> {
        let tsnap = await this.recurring.child(key).once('value');
        let item = tsnap.val() as RecurringTransaction;
        item.id = key;

        return item;
    }

    async saveRecurringTransaction(recurring: RecurringTransaction) {
        let rId: string = recurring.id || null;
        let date = Date.today().toFbString();

        date = date > this.m_periodStart ? date : this.m_periodStart;

        delete recurring.id;

        console.log(recurring);

        if (rId) {
            // update the recurring node
            await this.recurring.child(rId).set(recurring);
        } else {
            console.log("CREATING NEW RECURRING ENTRY");
            let ref = await this.recurring.push(recurring);
            rId = ref.key;
            console.log("PUSHED", rId);
        }

        // delete all matching after this date or today whichever is later
        await this.deleteRecurring(rId, false);

        // re-insert new transaction nodes starting with today or start whichever is later
        for (let day = Date.parseFb(recurring.start); day.le(recurring.end); day = day.add(recurring.period)) {
            if (day.toFbString() < date) continue;

            let transaction = {
                date: day.toFbString(),
                category: recurring.category,
                name: recurring.name,
                amount: recurring.amount,
                cash: recurring.cash || false,
                paid: false,
                transfer: recurring.transfer || false,
                note: recurring.note || null,
                recurring: rId
            };

            await this.transactions.push(transaction);
        }
    }

    async deleteRecurring(id: string, deleteRecurringNode: boolean = true) {
        let date = Date.today().toFbString();

        date = date > this.m_periodStart ? date : this.m_periodStart;

        // delete the recurring 
        if (deleteRecurringNode == true) {
            await this.recurring.child(id).remove();
        }

        // delete all matching after this date or today whichever is later
        let transactions = await this.getRecurringTransactions(id);

        for (let key in transactions) {
            let transaction = transactions[key];

            if ((transaction.date >= date) && (transaction.paid !== true)) {
                await this.deleteTransaction(key);
            }
        }
    }

    async getRecurringTransactions(id: string): Promise<TypeMap<TransactionStructure>> {
        let snap = await this.transactions.orderByChild('recurring').startAt(id).endAt(id).once('value');
        let transactions = snap.val() as TypeMap<TransactionStructure>;
        return transactions;
    }

    async getSameTransactions(item: TransactionStructure) : Promise<TransactionStructure[]> {

        let snap = await this.transactions.orderByChild('name').startAt(item.name).endAt(item.name).once('value');
        let transactions = snap.val() as TypeMap<TransactionStructure>;
        let items: Array<TransactionStructure> = [];
        
        for (var k in transactions) {
            if (transactions[k].category === item.category) {
                transactions[k].id = k;
                items.push(transactions[k]);
            }
        }

        items.sort((o1, o2) => {
            let d1 = Date.parseFb(o1.date);
            let d2 = Date.parseFb(o2.date);
            return d1.getTime() - d2.getTime();
        });

        return items;
    }

    async gotoPeriod(start: string | Date): Promise<TransactionStructure[]> {
        if (typeof start == "string") {
            start = Date.parseFb(start);
        }
        this.m_today = start as Date;
        let transactions = await this.selectPeriod();
        return transactions;
    }

    async selectPeriod() : Promise<TransactionStructure[]> {
        let startDate = this.m_today.periodCalc(Config.PERIOD_START, Config.PERIOD_LENGTH);

        this.m_periodStart = startDate.toFbString();
        this.m_periodEnd = (startDate.add(Config.PERIOD_LENGTH).subtract("1 day") as Date).toFbString();

        let snap : firebase.database.DataSnapshot;

        snap = await this.transactions.orderByChild('date').startAt(this.m_periodStart).endAt(this.m_periodEnd).once('value');
        
        let items = Transaction.sort(snap.val() as TypeMap<TransactionStructure>);
        this.m_loading = false;
        return items;
    }

    async getOutstandingChecksTotal() : Promise<number> {
        let csnap: firebase.database.DataSnapshot;
        let checks: TypeMap<Check>;
        let sum = 0;

        csnap = await this.m_primaryAccount.child('checks').once('value');
        checks = csnap.val() as TypeMap<Check>;

        for (var key in checks) {
            if (checks[key].link === undefined) {
                sum = Math.roundTo(sum - checks[key].amount, 2);
            }
        }

        return sum;
    }

    async getPeriodSum() : Promise<number> {
        let snap : firebase.database.DataSnapshot;
        let sum = 0;
        let checks = await this.getOutstandingChecksTotal();
        let transactions: TypeMap<TransactionStructure>;

        snap = await this.transactions.orderByChild('date').endAt(this.m_periodEnd).once('value');
        transactions = snap.val() as TypeMap<TransactionStructure>;
        for (var key in transactions) {
            sum = Math.roundTo(sum +  transactions[key].amount, 2);
        }

        return sum + checks;
    }

    async getDateTotals() : Promise<{[key:string]:number}> {
        let result : {[key:string]:number} = {};
        let sum = await this.getOutstandingChecksTotal();
        let snap : firebase.database.DataSnapshot;
        let data : TypeMap<TransactionStructure>;
        let transactions = new Array<TransactionStructure>();

        snap = await this.transactions.once('value');
        data = snap.val();

        for (var key in data) {
            transactions.push(data[key]);
        }

        transactions.sort((t1, t2) => {
            if (t1.date > t2.date) return 1;
            if (t1.date < t2.date) return -1;
            return 0;
        });


        for (var transaction of transactions) {
            sum = Math.roundTo(sum + transaction.amount, 2);
            result[transaction.date] = sum;
        }

        return result;
    }

    async clearCheck(id: string) {
        await this.m_primaryAccount.child('checks').child(id).remove();
    }

    async getData(): Promise<Object> {
        let snap = await this.root.once('value');
        let data: Object = snap.val() as Object;
        return data;
    }
}

$(() => {
    var app = new Application();

    Object.defineProperty(window, 'app', {
        get: () => { return app; }
    });
});
