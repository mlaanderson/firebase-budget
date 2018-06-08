import Dialog from "./dialog";
import Transaction from "../models/transaction";


export default class TransactionEditor extends Dialog {
    private transaction: Transaction;
    private saveTransaction: (transaction: Transaction) => void;
    private deleteTransaction: (id: string) => void;

    constructor(transaction: Transaction, saveTransaction: (transaction: Transaction) => void, deleteTransaction: (id: string) => void) {
        super('editransaction_v2', transaction);
        this.transaction = transaction;
        this.saveTransaction = saveTransaction || (async () => {});
        this.deleteTransaction = deleteTransaction || (async () => {});
    }

    protected afterOpen() {
        // wire up the close button
        this.m_dialog.find('#btnSave').on('click', async () => {
            let isDeposit = $("#type").prop('checked') as boolean;

            this.transaction.date = $('#date').val().toString();
            this.transaction.category = $('#category').val().toString();
            this.transaction.name = $('#name').val().toString();
            this.transaction.amount = ($('#amount').val() as number) * (isDeposit ? 1 : -1);
            this.transaction.cash = ($('#cash').prop('checked') as boolean) && (isDeposit == false);
            this.transaction.transfer = $('#transfer').prop('checked') as boolean;
            this.transaction.paid = $('#paid').prop('checked') as boolean;
            this.transaction.note = $('#note').val().toString();
            this.transaction.check = $('#checkNumber').val().toString();
            this.transaction.checkLink = $('#checkLink').val().toString(); 

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