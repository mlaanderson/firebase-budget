import Dialog from "./dialog";

export default class TransferDialog extends Dialog {
    constructor(total: number) {
        super('transfer', {total: total});
    }
}