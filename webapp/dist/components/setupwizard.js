"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
const spinner_1 = require("./spinner");
class EntryList {
    constructor() {
        this.index = 0;
        this.list = {};
    }
    push(value) {
        this.list[this.index] = value;
        return this.index++;
    }
    remove(at) {
        if (at in this.list) {
            return delete this.list[at];
        }
        return false;
    }
    toArray() {
        return Object.values(this.list);
    }
}
class SetupDialog extends dialog_1.default {
    constructor(categories, addRecurring) {
        super('setupwizard', { categories: categories });
        this.elements = {};
        this.lists = {
            income: new EntryList(),
            housing: new EntryList(),
            utilities: new EntryList(),
            transportation: new EntryList(),
            food: new EntryList(),
            other: new EntryList()
        };
        this.categoryMap = {
            income: "Income",
            housing: "Housing",
            utilities: "Utilities",
            transportation: "Transportation",
            food: "Food"
        };
        this.addRecurring = addRecurring;
    }
    removeItem(key, e) {
        let list = this.lists[key];
        let element = this.elements[key];
        let index = parseInt($(e.target).attr('index'));
        list.remove(index);
        $(e.target).remove();
    }
    addItem(key) {
        let list = this.lists[key];
        let element = this.elements[key];
        let entry = {
            name: $(`#${key}Name`).val().toString(),
            amount: parseFloat($(`#${key}Amount`).val().toString()),
            start: $(`#${key}Start`).val().toString(),
            period: $(`#${key}Period`).val().toString(),
            deposit: key == 'income',
            category: key == 'other' ? $('#otherCategory').val().toString() : this.categoryMap[key]
        };
        let index = list.push(entry);
        element.append($(`<li data-icon="delete" class="ui-first-child ui-last-child">`).append($(`<a href="#" class="ui-btn ui-btn-icon-right ui-icon-delete" index="${index}">${entry.name} - ${entry.amount.toCurrency()}</a>`).on('click', (e) => this.removeItem('income', e)))).trigger('create');
        $(`#${key}Name`).val('').focus();
        $(`#${key}Amount`).val('');
        $(`#${key}Period`).val('');
    }
    createTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            spinner_1.default.show();
            let promises = new Array();
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
            yield Promise.all(promises);
            spinner_1.default.hide();
            this.close();
        });
    }
    sizePanel(e, ui) {
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
            $(`#${key}Add`).on('click', (e) => this.addItem(key));
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
exports.default = SetupDialog;
