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
        this.m_dialog.find('#searchTable').css('height', $(window).innerHeight() * 0.7).css('width', $(window).innerWidth() * 0.8);
    }

    afterOpen() {
        let searchTextBox = this.m_dialog.find('#searchTextBox');
        let searchButton = this.m_dialog.find('#searchButton');
        let searchResults = this.m_dialog.find('#searchResults');

        searchTextBox.width(searchResults.width() - searchButton.innerWidth() - 30);
        searchTextBox.height(searchButton.innerHeight() - 4);

        searchTextBox.focus();
        
        searchButton.on('click', async () => {
            searchResults.empty();
            if (searchTextBox.val() == '') return;

            let results = await this.transactions.search(searchTextBox.val() as string);

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