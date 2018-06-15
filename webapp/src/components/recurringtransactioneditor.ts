import Dialog from "./dialog";
import RecurringTransaction from "../models/recurringtransaction";


export default class RecurringTransactionEditor extends Dialog {
    private transaction: RecurringTransaction;
    private saveTransaction: (transaction: RecurringTransaction) => void;
    private deleteTransaction: (id: string) => void;
    private categories: Array<string>;

    constructor(transaction: RecurringTransaction, saveTransaction: (transaction: RecurringTransaction) => void, deleteTransaction: (id: string) => void, categories: Array<string>) {
        super('editrecurring_v2', { transaction: transaction, categories: categories });
        this.transaction = transaction;
        this.categories = categories;
        this.saveTransaction = saveTransaction || (async () => {});
        this.deleteTransaction = deleteTransaction || (async () => {});
    }

    protected afterOpen() {
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

            await this.saveTransaction(this.transaction);
            this.close();
        });

        // wire up the delete button
        this.m_dialog.find('#btnDelete').on('click', async() => {
            await this.deleteTransaction(this.transaction.id);
            this.close();
        });

        // allow the enter key to click the save button
        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.charCode == 13) {
                e.preventDefault();
                this.m_dialog.find('#btnSave').click();
            }
        });
    }
}