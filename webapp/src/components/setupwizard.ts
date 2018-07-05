import Dialog from "./dialog";
import RecurringTransaction from "../models/recurringtransaction";
import Spinner from "./spinner";

type AddRecurringMethod = (transaction: RecurringTransaction) => Promise<string>
type Entry = { name: string, category: string, amount: number; start: string, period: string, deposit: boolean };

class EntryList {
    private index = 0;
    private list: { [key: number]: Entry } = {}

    push(value: Entry) : number {
        this.list[this.index] = value;
        return this.index++;
    }

    remove(at: number) : boolean {
        if (at in this.list) {
            return delete this.list[at];
        }
        return false;
    }

    toArray() : Array<Entry> {
        return Object.values(this.list);
    }
}

export default class SetupDialog extends Dialog {
    private addRecurring: AddRecurringMethod;
    private elements: {[key: string] : JQuery<HTMLElement>} = {}
    private lists: {[key: string]:EntryList} = { 
        income : new EntryList(),
        housing: new EntryList(),
        utilities: new EntryList(),
        transportation: new EntryList(),
        food: new EntryList(),
        other: new EntryList()
    };

    private categoryMap : {[key: string]: string} = {
        income: "Income",
        housing: "Housing",
        utilities: "Utilities",
        transportation: "Transportation",
        food: "Food"
    }

    constructor(categories: Array<string>, addRecurring: AddRecurringMethod) {
        super('setupwizard', { categories: categories });
        this.addRecurring = addRecurring;
    }

    removeItem(key: string, e: JQuery.Event) {
        let list = this.lists[key];
        let element = this.elements[key];
        let index = parseInt($(e.target).attr('index'));
        list.remove(index);
        $(e.target).remove();
    }

    addItem(key: string) {
        let list = this.lists[key];
        let element = this.elements[key];
        let entry : Entry = {
            name: $(`#${key}Name`).val().toString(),
            amount: parseFloat($(`#${key}Amount`).val().toString()),
            start: $(`#${key}Start`).val().toString(),
            period: $(`#${key}Period`).val().toString(),
            deposit: key == 'income',
            category: key == 'other' ? $('#otherCategory').val().toString() : this.categoryMap[key]
        };
        let index = list.push(entry);
        element.append($(`<li data-icon="delete" class="ui-first-child ui-last-child">`).append(
            $(`<a href="#" class="ui-btn ui-btn-icon-right ui-icon-delete" index="${index}">${entry.name} - ${entry.amount.toCurrency()}</a>`).on('click', (e: JQuery.Event) => this.removeItem('income', e))
        )).trigger('create');

        $(`#${key}Name`).val('').focus();
        $(`#${key}Amount`).val('');
        $(`#${key}Period`).val('');
    }

    async createTransactions() {
        Spinner.show();
        let promises = new Array<Promise<string>>();
        for (var key in this.lists) {
            let list = this.lists[key].toArray();
            for (let entry of list) {
                let end = Date.today().add("1 year").toFbString();
                promises.push(this.addRecurring({
                    name: entry.name,
                    amount: entry.amount * (entry.deposit ? 1 : -1),
                    start: entry.start,
                    end: end,
                    period: entry.period,
                    category: entry.category
                }));
            }
        }
        await Promise.all(promises);
        Spinner.hide();
        this.close();
    }

    sizePanel(e: JQuery.Event, ui: {oldTab: JQuery<HTMLElement>, oldPanel: JQuery<HTMLElement>, newTab: JQuery<HTMLElement>, newPanel: JQuery<HTMLElement>}) {
        let windowHeight = $(window).innerHeight();
        let dialogHeight = $(this.m_dialog).outerHeight(true);
        let grow = windowHeight - dialogHeight;

        let fields = ui.newPanel.find('.ui-field-contain');
        fields.height(fields.height() + grow);

        this.m_dialog.popup('reposition', { positionTo: 'window' });
    }

    afterRender() {
        super.afterRender();

        this.m_dialog.find('#btnSaveSetup').on('click', this.createTransactions.bind(this));
        this.m_dialog.find('#btnCancelSetup').on('click', () => this.close());

        for (let key in this.lists) {
            this.elements[key] = $(`#${key}List`);
            $(`#${key}Add`).on('click', (e: JQuery.Event) => this.addItem(key));
        }

        this.m_dialog.find('[data-role=tabs]').on('tabsactivate', this.sizePanel.bind(this));
    }

    afterOpen() {
        super.afterOpen();
        this.sizePanel(null, {
            oldTab: null,
            oldPanel: null,
            newPanel: $('#income'),
            newTab: null
        });
    }
}