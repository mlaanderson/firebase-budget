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
const piereport_1 = require("./piereport");
class PeriodReport extends piereport_1.default {
    listenToTransactions(transactions) {
        this.m_start = transactions.Start;
        this.m_end = transactions.End;
        transactions.on('addedinperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            this.update(transaction);
        }));
        transactions.on('changed', (transaction) => __awaiter(this, void 0, void 0, function* () {
            this.update(transaction);
        }));
        transactions.on('removedinperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            this.m_transactions = this.m_transactions.filter((tr) => tr.id != transaction.id);
            this.displayList(this.m_transactions);
        }));
        this.displayList(transactions.List);
    }
}
exports.default = PeriodReport;
