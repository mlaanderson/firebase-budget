import "../lib/date.ext";
import Timespan from "../lib/timespan";
import { Config } from "../app";
import TypeMap from "./maps";

export interface TransactionStructure {
    id?: string;
    date : string;
    category : string;
    name : string;
    amount : number;
    cash : boolean | undefined;
    paid: boolean | undefined;
    transfer : boolean | undefined;
    note : string | undefined;
    check : string | undefined;
    checkLink : string | undefined;
    recurring : string | undefined;
}

export class Transaction {
    id?: string;
    date : Date;
    category : string;
    name : string;
    amount : number;
    cash : boolean | undefined;
    paid: boolean | undefined;
    transfer : boolean | undefined;
    note : string | undefined;
    check : string | undefined;
    checkLink : string | undefined;
    recurring : string | undefined;

    constructor(value? : TransactionStructure) {
        if (value) {
            this.id = value.id;
            this.date = Date.parseFb(value.date);
            this.category = value.category;
            this.name = value.name;
            this.amount = value.amount;
            this.cash = value.cash;
            this.paid = value.paid;
            this.transfer = value.transfer;
            this.note = value.note;
            this.check = value.check;
            this.checkLink = value.checkLink;
            this.recurring = value.recurring;
        } else {
            this.date = Date.today();
            this.category = Config.CATEGORIES[0];
            this.name = "";
            this.amount = 0;
        }
    }

    toJSON() : TransactionStructure {
        var data : TransactionStructure = {
            date: this.date.toFbString(),
            category : this.category,
            name: this.name,
            amount: this.amount,
            cash: this.cash,
            paid: this.paid,
            transfer: this.transfer,
            note: this.note,
            check: this.check,
            checkLink: this.checkLink,
            recurring: this.recurring
        };
        return data;
    }

    static sort(transactions: TypeMap<TransactionStructure>) : Array<TransactionStructure> {
        // sort into categories and names
        var result = new Array<TransactionStructure>();

        for (var k in transactions) {
            var o: TransactionStructure = transactions[k];
            o.id = k;
            result.push(o);
        }

        function sorter(o1 : TransactionStructure, o2: TransactionStructure) : number {
            if (o1.category !== o2.category) {
                return Config.CATEGORIES.indexOf(o1.category) - Config.CATEGORIES.indexOf(o2.category);
            }

            if (o1.name > o2.name) {
                return 1;
            }
            if (o1.name < o2.name) {
                return -1;
            }
            return 0;
        }

        result.sort(sorter);

        return result;
    }
}

export default Transaction;