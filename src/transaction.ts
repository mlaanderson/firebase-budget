import "./lib/date.ext";
import Timespan from "./lib/timespan";

interface TransactionStructure {
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
    static CATEGORIES = [
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
            this.category = Transaction.CATEGORIES[0];
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
}

export default Transaction;