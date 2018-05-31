"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../lib/date.ext");
const app_1 = require("../app");
class Transaction {
    constructor(value) {
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
        }
        else {
            this.date = Date.today();
            this.category = app_1.Config.CATEGORIES[0];
            this.name = "";
            this.amount = 0;
        }
    }
    toJSON() {
        var data = {
            date: this.date.toFbString(),
            category: this.category,
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
    static sort(transactions) {
        // sort into categories and names
        var result = new Array();
        for (var k in transactions) {
            var o = transactions[k];
            o.id = k;
            result.push(o);
        }
        function sorter(o1, o2) {
            if (o1.category !== o2.category) {
                return app_1.Config.CATEGORIES.indexOf(o1.category) - app_1.Config.CATEGORIES.indexOf(o2.category);
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
exports.Transaction = Transaction;
exports.default = Transaction;
