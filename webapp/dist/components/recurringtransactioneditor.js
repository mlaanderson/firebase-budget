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
require("../lib/jquery.ext");
const spinner_1 = require("./spinner");
class RecurringTransactionEditor extends dialog_1.default {
    constructor(transaction, saveTransaction, deleteTransaction, categories, names) {
        super('editrecurring_v2', { transaction: transaction, categories: categories, names: names });
        this.transaction = transaction;
        this.categories = categories;
        this.saveTransaction = saveTransaction || (() => __awaiter(this, void 0, void 0, function* () { }));
        this.deleteTransaction = deleteTransaction || (() => __awaiter(this, void 0, void 0, function* () { }));
    }
    afterOpen() {
        this.m_dialog.find('#period').on('validity', (e) => {
            this.m_dialog.find('#btnSave').attr('disabled', !this.m_dialog.find('#period').timespan('valid'));
        });
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
            spinner_1.default.show();
            yield this.saveTransaction(this.transaction);
            spinner_1.default.hide();
            this.close();
        }));
        // wire up the cancel button
        this.m_dialog.find('#btnCancel').on('click', () => {
            this.close();
        });
        // wire up the delete button
        this.m_dialog.find('#btnDelete').on('click', () => __awaiter(this, void 0, void 0, function* () {
            spinner_1.default.show();
            yield this.deleteTransaction(this.transaction.id);
            spinner_1.default.hide();
            this.close();
        }));
        // allow the enter key to click the save button
        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.charCode == 13) {
                e.preventDefault();
                this.m_dialog.find('#btnSave').click();
            }
        });
        // fix the height of the ui-field-contain div
        let windowHeight = 1 * $(window).innerHeight();
        let dialogHeight = this.m_dialog.outerHeight(true);
        if (dialogHeight > windowHeight) {
            let adjust = dialogHeight - windowHeight;
            this.m_dialog.find('.ui-field-contain').height(this.m_dialog.find('.ui-field-contain').height() - adjust);
            this.m_dialog.popup('reposition', { positionTo: 'window' });
        }
    }
}
exports.default = RecurringTransactionEditor;
