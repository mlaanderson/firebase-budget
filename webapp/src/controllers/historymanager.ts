import * as firebase from "firebase/app";
import "firebase/auth";
import EditHistory, { HistoryItem } from "../models/history";
import Transaction from "../models/transaction";
import RecurringTransaction from "../models/recurringtransaction";
import Transactions from "./transactions";
import RecurringTransactions from "./recurringtransactions";
import Events from "./events";

export default class HistoryManager extends Events {
    private transactions: Transactions;
    private recurring: RecurringTransactions;
    private pointer: number = 0;
    private items: Array<EditHistory>;

    constructor(transactions: Transactions, recurring: RecurringTransactions) {
        super();
        var items = new Array<EditHistory>();
        var pointer = 0;

        if (window.localStorage && localStorage.getItem('budget.history') !== null) {
            let stored = JSON.parse(localStorage.getItem('budget.history'))[firebase.auth().currentUser.uid];
            if (stored) {
                items.push(...stored.items as Array<EditHistory>);
                pointer = stored.pointer as number;
            }
        }

        this.pointer = pointer;
        this.items = new Array<EditHistory>(...items);

        this.transactions = transactions;
        this.recurring = recurring;

        setImmediate(() => this.emitAsync('change'));
    }

    private storeHistory() {
        if (window.localStorage) {
            let data = JSON.parse(window.localStorage.getItem('budget.history') || "{}") as {[key:string] : Object};
            data[firebase.auth().currentUser.uid] = this.toJSON();
            window.localStorage.setItem('budget.history', JSON.stringify(data));
        }
    }

    push(item: EditHistory) : number {
        // remove all the items after the pointer,
        // we've branched the undo process and cannot 
        // guarantee redos would not break things
        this.items.splice(this.pointer);

        // update the pointer
        this.pointer++;

        let n = this.items.push(item);

        // limit the history size so localstorage doesn't get overwhelmed
        while (this.items.length > 100) {
            this.items.shift();
            this.pointer--;
        }

        this.storeHistory();
        this.emitAsync('change');

        return n;
    }

    get canUndo() : boolean {
        return this.pointer > 0;
    }

    get canRedo() : boolean {
        return this.pointer < this.items.length;
    }

    private async revertChange(change: HistoryItem) {
        if (change.initial) {
            switch(change.type) {
                case 'Recurring':
                    await this.recurring.save(change.initial as RecurringTransaction);
                break;
                case 'Transaction':
                    await this.transactions.save(change.initial as Transaction);
                break;
            }
        }
    }

    private async redoChange(change: HistoryItem) {
        if (change.final) {
            switch(change.type) {
                case 'Recurring':
                    await this.recurring.save(change.final as RecurringTransaction);
                break;
                case 'Transaction':
                    await this.transactions.save(change.final as Transaction);
                break;
            }
        }
    }

    private async revertCreate(change: HistoryItem) {
        switch(change.type) {
            case 'Recurring':
                let reverted: RecurringTransaction = {
                    amount: change.final.amount,
                    cash: change.final.cash,
                    category: change.final.category,
                    end: (change.final as RecurringTransaction).end,
                    id: change.final.id,
                    name: change.final.name,
                    note: change.final.note,
                    period: (change.final as RecurringTransaction).period,
                    start: (change.final as RecurringTransaction).start,
                    transfer: change.final.transfer,
                    delete: (change.final as RecurringTransaction).active
                };
                await this.recurring.save(reverted);
            break
            case 'Transaction':
                await this.transactions.remove(change.final as Transaction);
            break;
        }
    }

    private async redoCreate(change: HistoryItem) {
        switch(change.type) {
            case 'Recurring':
                await this.recurring.save(change.final as RecurringTransaction);
            break
            case 'Transaction':
                await this.transactions.save(change.final as Transaction);
            break;
        }
    }

    private async revertDelete(change: HistoryItem) {
        switch(change.type) {
            case 'Recurring':
                let reverted: RecurringTransaction = {
                    amount: change.final.amount,
                    cash: change.final.cash,
                    category: change.final.category,
                    end: (change.final as RecurringTransaction).end,
                    id: change.final.id,
                    name: change.final.name,
                    note: change.final.note,
                    period: (change.final as RecurringTransaction).period,
                    start: (change.final as RecurringTransaction).start,
                    transfer: change.final.transfer,
                    active: (change.final as RecurringTransaction).delete
                };
                await this.recurring.save(reverted);
            break
            case 'Transaction':
                await this.transactions.save(change.final as Transaction);
            break;
        }
    }

    private async redoDelete(change: HistoryItem) {
        switch(change.type) {
            case 'Recurring':
                await this.recurring.save(change.final as RecurringTransaction);
            break
            case 'Transaction':
                await this.transactions.remove(change.final as Transaction);
            break;
        }
    }

    async undo() {
        if (!this.canUndo) return;

        this.pointer--;
        let changes = this.items[this.pointer];
        for (let change of changes.items) {
            switch(change.action) {
                case 'change': await this.revertChange(change); break;
                case 'create': await this.revertCreate(change); break;
                case 'delete': await this.revertDelete(change); break;
            }
        }
        this.emitAsync('change');
        this.storeHistory();
    }

    async redo() {
        if (!this.canRedo) return;

        let changes = this.items[this.pointer];
        for (let change of changes.items) {
            switch(change.action) {
                case 'change': await this.redoChange(change); break;
                case 'create': await this.redoCreate(change); break;
                case 'delete': await this.redoDelete(change); break;
            }
        }
        this.pointer++;
        this.emitAsync('change');
        this.storeHistory();
    }

    clear() {
        this.items = [];
        this.pointer = 0;
        this.emitAsync('change');
        this.storeHistory();
    }

    toJSON() : Object {
        return {
            pointer: this.pointer,
            items: this.items
        }
    }
}