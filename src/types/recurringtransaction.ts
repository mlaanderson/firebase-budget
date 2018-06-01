export interface RecurringTransaction {
    id?: string;
    start : string;
    end : string;
    period : string;
    category : string;
    name : string;
    amount : number;
    cash? : boolean;
    transfer? : boolean;
    note : string | undefined;
}

export default RecurringTransaction;