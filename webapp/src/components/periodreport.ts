import PieReport from "./piereport";
import Transaction from "../models/transaction";
import Transactions from "../controllers/transactions";


export default class PeriodReport extends PieReport {
    listenToTransactions(transactions: Transactions) {
        this.m_start = transactions.Start;
        this.m_end = transactions.End;

        transactions.on('addedinperiod', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('changed', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('removedinperiod', async (transaction: Transaction) => {
            this.m_transactions = this.m_transactions.filter((tr) => tr.id != transaction.id);
            this.displayList(this.m_transactions);
        });

        this.displayList(transactions.List);
    }
}