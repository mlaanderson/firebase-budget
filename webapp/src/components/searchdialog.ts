import Dialog from "./dialog";
import Transactions from "../controllers/transactions";


export default class SearchDialog extends Dialog {
    private transactions: Transactions;

    public GotoPeriod: (date: string) => void = (date) => { console.log(date); };

    constructor(transactions: Transactions) {
        super('search');
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
        
        searchButton.on('click', async () => {
            searchTextBox.blur();
            searchResults.empty();
            if (searchTextBox.val() == '') return;

            let results = await this.transactions.search(searchTextBox.val() as string);
            results = results.slice();

            results.sort((a, b) => {
                return Date.parseFb(a.date).getTime() - Date.parseFb(b.date).getTime();
            })

            for (let result of results) {
                this.render('searchresult', {item: result}).then((template) => {
                    let row = $(template);
                    searchResults.append(row);

                    row.on('click', () => {
                        this.GotoPeriod(result.date);
                    });

                    row.on('mouseover', () => {
                        searchResults.children('tr').css('background-color', '');
                        row.css('background-color', '#eef');
                    })
                });
            }
        });

        searchTextBox.on('keypress', (e) => {
            if (e.keyCode == 13) {
                searchButton.click();
            }
        });
    }
}