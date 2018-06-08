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
const dialog_1 = require("./dialog");
class RecurringTransactionEditor extends dialog_1.default {
    constructor(transaction, saveTransaction, deleteTransaction) {
        super('editrecurring_v2', transaction);
        this.transaction = transaction;
        this.saveTransaction = saveTransaction || (() => __awaiter(this, void 0, void 0, function* () { }));
        this.deleteTransaction = deleteTransaction || (() => __awaiter(this, void 0, void 0, function* () { }));
    }
    afterOpen() {
        // wire up the close button
        this.m_dialog.find('#btnSave').on('click', () => __awaiter(this, void 0, void 0, function* () {
            let isDeposit = $("#type").prop('checked');
            this.transaction.period = $('#period').val().toString();
            this.transaction.start = $('#start').val().toString();
            this.transaction.end = $('#end').val().toString();
            this.transaction.category = $('#category').val().toString();
            this.transaction.name = $('#name').val().toString();
            this.transaction.amount = $('#amount').val() * (isDeposit ? 1 : -1);
            this.transaction.cash = $('#cash').prop('checked') && (isDeposit == false);
            this.transaction.transfer = $('#transfer').prop('checked');
            this.transaction.note = $('#note').val().toString();
            yield this.saveTransaction(this.transaction);
            this.close();
        }));
        // wire up the delete button
        this.m_dialog.find('#btnDelete').on('click', () => __awaiter(this, void 0, void 0, function* () {
            yield this.deleteTransaction(this.transaction.id);
            this.close();
        }));
        // allow the enter key to click the save button
        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.charCode == 13) {
                e.preventDefault();
                this.m_dialog.find('#btnSave').click();
            }
        });
    }
}
exports.default = RecurringTransactionEditor;
