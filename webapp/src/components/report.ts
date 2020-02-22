import Dialog from "./dialog";
import TransactionViewer from "./transactionviewer";
import Transaction from "../models/transaction";
import { RecordMap } from "../models/record";
import Transactions from "../controllers/transactions";

export default abstract class Report extends Dialog implements TransactionViewer {

    constructor(filename: string, data?: Object) {
        super(filename, data);
    }

    abstract displayList(transactions: Array<Transaction>) : void;

    abstract display(transactions: RecordMap<Transaction>) : void;

    abstract update(transaction: Transaction, total?: number) : void;

    abstract clear() : void;

    abstract listenToTransactions(transactions: Transactions) : void;

    turnOffUpdates(){}
    turnOnUpdates(){}
}