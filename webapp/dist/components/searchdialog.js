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
class SearchDialog extends dialog_1.default {
    constructor(transactions) {
        super('search');
        this.GotoPeriod = (date) => { console.log(date); };
        this.transactions = transactions;
    }
    afterRender() {
        this.m_dialog.css('height', $(window).innerHeight() * 0.7).css('width', $(window).innerWidth() * 0.8);
    }
    afterOpen() {
        let searchTextBox = this.m_dialog.find('#searchTextBox');
        let searchButton = this.m_dialog.find('#searchButton');
        let searchResults = this.m_dialog.find('#searchResults');
        // setup the table height
        let dialogHeight = this.m_dialog.height();
        let titleHeight = this.m_dialog.find('[data-role=header]').outerHeight(true);
        let formHeight = this.m_dialog.find('.ui-field-contain').outerHeight(true);
        this.m_dialog.find('[role=main]').innerHeight(dialogHeight - titleHeight);
        this.m_dialog.find('#searchTable').innerHeight(this.m_dialog.find('[role=main]').innerHeight() - titleHeight - formHeight);
        searchTextBox.focus();
        searchButton.on('click', () => __awaiter(this, void 0, void 0, function* () {
            searchTextBox.blur();
            searchResults.empty();
            if (searchTextBox.val() == '')
                return;
            let results = yield this.transactions.search(searchTextBox.val());
            results = results.slice();
            results.sort((a, b) => {
                return Date.parseFb(a.date).getTime() - Date.parseFb(b.date).getTime();
            });
            for (let result of results) {
                this.render('searchresult', { item: result }).then((template) => {
                    let row = $(template);
                    searchResults.append(row);
                    row.on('click', () => {
                        this.GotoPeriod(result.date);
                    });
                    row.on('mouseover', () => {
                        searchResults.children('tr').css('background-color', '');
                        row.css('background-color', '#eef');
                    });
                });
            }
        }));
        searchTextBox.on('keypress', (e) => {
            if (e.keyCode == 13) {
                searchButton.click();
            }
        });
    }
}
exports.default = SearchDialog;
