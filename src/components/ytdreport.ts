import PieReport from "./piereport";
import Transaction from "../models/transaction";
import Transactions from "../controllers/transactions";


export default class YTDReport extends PieReport {
    async listenToTransactions(transactions: Transactions) {
        let year = Date.parseFb(transactions.Start).getUTCFullYear();
        this.m_start = `${year}-01-01`;
        this.m_end = transactions.End;

        transactions.on('added', async (transaction: Transaction) => {
            if (this.m_start <= transaction.date && transaction.date <= this.m_end) {
                this.update(transaction);
            }
        });

        transactions.on('changed', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('removed', async (transaction: Transaction) => {
            this.update(transaction);
        });


        let ytd = await transactions.loadRecordsByChild('date', this.m_start, this.m_end);
        this.display(ytd);
    }
}