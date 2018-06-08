import Dialog from "./dialog"
import Cash from "../models/cash";

export default class CashDialog extends Dialog {
    constructor(data: Cash) {
        super('cash', data);
    }
}