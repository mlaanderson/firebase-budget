import { Record } from "./record";

export default interface RecurringTransaction extends Record {
    amount : number;
    cash? : boolean;
    category : string;
    end : string;
    name : string;
    note? : string;
    period : string;
    start : string;
    transfer? : boolean;
    active?: string;
    delete?: string;
}