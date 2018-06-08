import Transaction from "../models/transaction";
import { RecordMap } from "../models/record";


export default interface TransactionViewer {
    displayList(transactions: Array<Transaction>) : void;
    display(transactions: RecordMap<Transaction>) : void;
    update(transaction: Transaction, total?: number) : void;
}
