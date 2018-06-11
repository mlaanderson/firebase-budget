import { Record } from "./record";

export default interface Transaction extends Record {
    amount : number;
    cash? : boolean;
    category : string;
    check? : string;
    date : string;
    name : string;
    note? : string;
    paid?: boolean;
    recurring? : string;
    transfer? : boolean;
}
