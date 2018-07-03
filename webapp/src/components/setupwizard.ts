import Dialog from "./dialog";
import RecurringTransaction from "../models/recurringtransaction";

type AddRecurringMethod = (transaction: RecurringTransaction) => Promise<string>

export default class SetupDialog extends Dialog {
    private addRecurring: AddRecurringMethod;

    constructor(addRecurring: AddRecurringMethod) {
        super('setupwizard');
        this.addRecurring = addRecurring;
    }

    afterRender() {
        super.afterRender();

        this.m_dialog.find('#btnSaveSetup').on('click', () => { console.log('you touched me')});
    }
}