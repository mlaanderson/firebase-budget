import Transaction from "./transaction";
import RecurringTransaction from "./recurringtransaction";

export interface HistoryItem {
    action: "create" | "change" | "delete";
    type: "Transaction" | "Recurring";
    initial?: Transaction | RecurringTransaction;
    final: Transaction | RecurringTransaction;
}

export default interface EditHistory {
    items: Array<HistoryItem>;
}