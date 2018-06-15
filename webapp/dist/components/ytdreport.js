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
class YTDReport extends piereport_1.default {
    listenToTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            let year = Date.parseFb(transactions.Start).getUTCFullYear();
            this.m_start = `${year}-01-01`;
            this.m_end = transactions.End;
            transactions.on('added', (transaction) => __awaiter(this, void 0, void 0, function* () {
                if (this.m_start <= transaction.date && transaction.date <= this.m_end) {
                    this.update(transaction);
                }
            }));
            transactions.on('changed', (transaction) => __awaiter(this, void 0, void 0, function* () {
                this.update(transaction);
            }));
            transactions.on('removed', (transaction) => __awaiter(this, void 0, void 0, function* () {
                this.update(transaction);
            }));
            let ytd = yield transactions.loadRecordsByChild('date', this.m_start, this.m_end);
            this.display(ytd);
        });
    }
}
exports.default = YTDReport;
