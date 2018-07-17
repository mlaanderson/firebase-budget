import Dialog from "./dialog";
import RecurringTransaction from "../models/recurringtransaction";
import "../lib/jquery.ext";
import Spinner from "./spinner";

export default class RecurringTransactionEditor extends Dialog {
    private transaction: RecurringTransaction;
    private saveTransaction: (transaction: RecurringTransaction) => void;
    private deleteTransaction: (id: string) => void;
    private categories: Array<string>;

    constructor(transaction: RecurringTransaction, saveTransaction: (transaction: RecurringTransaction) => void, deleteTransaction: (id: string) => void, categories: Array<string>, names: Array<string>) {
        super('editrecurring_v2', { transaction: transaction, categories: categories, names: names });
        this.transaction = transaction;
        this.categories = categories;
        this.saveTransaction = saveTransaction || (async () => {});
        this.deleteTransaction = deleteTransaction || (async () => {});
    }

    protected afterOpen() {
        this.m_dialog.find('#period').on('validity', (e: JQuery.Event) => {
            this.m_dialog.find('#btnSave').attr('disabled', !this.m_dialog.find('#period').timespan('valid'));
        });
        // wire up the close button
        this.m_dialog.find('#btnSave').on('click', async () => {
            let isDeposit = $("#type").prop('checked') as boolean;

            this.transaction.period = $('#period').val().toString();
            this.transaction.start = $('#start').val().toString();
            this.transaction.end = $('#end').val().toString();
            this.transaction.category = $('#category').val().toString();
            this.transaction.name = $('#name').val().toString();
            this.transaction.amount = ($('#amount').val() as number) * (isDeposit ? 1 : -1);
            this.transaction.cash = ($('#cash').prop('checked') as boolean) && (isDeposit == false);
            this.transaction.transfer = $('#transfer').prop('checked') as boolean;
            this.transaction.note = $('#note').val().toString();

            Spinner.show();
            await this.saveTransaction(this.transaction);
            Spinner.hide();
            this.close();
        });

        // wire up the cancel button
        this.m_dialog.find('#btnCancel').on('click', () => {
            this.close();
        });

        // wire up the delete button
        this.m_dialog.find('#btnDelete').on('click', async() => {
            Spinner.show();
            await this.deleteTransaction(this.transaction.id);
            Spinner.hide();
            this.close();
        });

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