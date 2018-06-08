"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Configuration {
    // passed reference should be the current user root
    constructor(reference) {
        this.data = {
            categories: ["Income",
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
                "Debt"],
            periods: {
                length: "2 weeks",
                start: "2016-06-24"
            }
        };
        this.ref = reference;
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            let snap = yield this.ref.child('config').once('value');
            if (snap.val()) {
                this.data = snap.val();
            }
            return this.data;
        });
    }
    get categories() {
        return this.data.categories;
    }
    get start() {
        return this.data.periods.start;
    }
    get length() {
        return this.data.periods.length;
    }
    calculatePeriod(date) {
        if (typeof date === "string") {
            date = Date.parseFb(date);
        }
        let start = date.periodCalc(this.start, this.length);
        let end = start.add(this.length).subtract('1 day');
        return {
            start: start.toFbString(),
            end: end.toFbString()
        };
    }
    toJSON() {
        return this.data || {};
    }
}
exports.default = Configuration;
