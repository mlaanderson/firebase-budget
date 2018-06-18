import Transaction from "../models/transaction";
import { RecordMap } from "../models/record";
import Transactions from "../controllers/transactions";


export default interface TransactionViewer {
    displayList(transactions: Array<Transaction>) : void;
    display(transactions: RecordMap<Transaction>) : void;
    update(transaction: Transaction, total?: number) : void;
    clear() : void;
    listenToTransactions(transactions: Transactions) : void;
}
