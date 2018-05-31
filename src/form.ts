/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./ejs.d.ts" />

import Application from "./app";
import { TransactionStructure } from "./types/transaction";
import "./lib/number.ext";
import "./lib/input.ext";

interface EventHandler<TCurrentTarget extends EventTarget, TData = null> extends JQuery.EventHandler<TCurrentTarget, TData> {
    preventDefault(): void;
}


export default class Form {
    application: Application;

    btnLogout: JQuery<HTMLElement>;
    btnPrev: JQuery<HTMLElement>;
    btnNext: JQuery<HTMLElement>;
    periodMenu: JQuery<HTMLElement>;
    btnCash: JQuery<HTMLElement>;
    btnReport: JQuery<HTMLElement>;
    btnTransfer: JQuery<HTMLElement>;
    btnAddTransaction: JQuery<HTMLElement>;
    btnEditTransaction: JQuery<HTMLElement>;
    btnNewRecurring: JQuery<HTMLElement>;
    btnDownload: JQuery<HTMLElement>;
    btnConfig: JQuery<HTMLElement>;
    main: JQuery<HTMLElement>;
    header: JQuery<HTMLElement>;
    footer: JQuery<HTMLElement>;

    activePopup: JQuery<HTMLElement>;

    constructor(app : Application) {
        var self = this;
        this.btnLogout = $('#btnLogout').on('click', this.btnLogout_Click.bind(this));
        this.btnPrev = $('#btnPrev').on('click', this.btnPrev_click.bind(this));
        this.btnNext = $('#btnNext').on('click', this.btnNext_click.bind(this));
        this.btnCash = $('#btnCash').on('click', this.btnCash_click.bind(this));
        this.btnReport = $('#btnReport').on('click', this.btnReport_click.bind(this));
        this.btnTransfer = $('#btnTransfer').on('click', this.btnTransfer_click.bind(this));
        this.btnAddTransaction = $('#btnAddTransaction').on('click', this.btnAddTransaction_click.bind(this));
        this.btnEditTransaction = $('#btnEditTransaction').on('click', this.btnEditTransaction_click.bind(this));
        this.btnNewRecurring = $('#btnNewRecurring').on('click', this.btnNewRecurring_click.bind(this));
        this.btnDownload = $('#btnDownload').on('click', this.btnDownload_click.bind(this));
        this.btnConfig = $('#btnConfig').on('click', this.btnConfig_click.bind(this));

        this.periodMenu = $('#periodMenu').on('change', this.periodMenu_Change.bind(this));
        this.main = $('#main').on('mouseout', this.main_MouseOut.bind(this));
        this.header = $('[data-role=header]');
        this.footer = $('[data-role=footer]');

        ejs.renderFile('index', {}, (template) => {
            self.main.append($(template));
        });

        $(window).on('resize', this.window_Resize.bind(this));

        this.application = app;
    }

    window_Resize(e: EventHandler<HTMLElement>) {
        this.main.css('max-height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
        this.main.css('height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
    }

    periodMenu_Change(e: EventHandler<HTMLElement>) {

    }

    main_MouseOut(e: EventHandler<HTMLElement>) {
        setTimeout(() => {
            this.btnEditTransaction.prop('targetId', '');
        }, 150);
    }

    
    btnLogout_Click(e: EventHandler<HTMLElement>) {
        e.preventDefault();
        this.application.signout().then(this.clear.bind(this));
    }

    btnPrev_click(e: EventHandler<HTMLElement>) {
        e.preventDefault();
        this.application.backOne().then(this.updateTransactions);
    }

    btnNext_click(e: EventHandler<HTMLElement>) {
        e.preventDefault();
        this.application.forwardOne().then(this.updateTransactions);
    }

    btnCash_click(e: EventHandler<HTMLElement>) {}
    btnReport_click(e: EventHandler<HTMLElement>) {}
    btnTransfer_click(e: EventHandler<HTMLElement>) {}
    btnAddTransaction_click(e: EventHandler<HTMLElement>) {}
    btnEditTransaction_click(e: EventHandler<HTMLElement>) {}
    btnNewRecurring_click(e: EventHandler<HTMLElement>) {}
    btnDownload_click(e: EventHandler<HTMLElement>) {}
    btnConfig_click(e: EventHandler<HTMLElement>) {}

    render(path: string, data: Object) : Promise<string> {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path, data, (template) => {
                resolve(template);
            });
        });
    }

    /**
     * Clears the account data from the form
     */
    async clear() {
        let self = this;
        
        $('#tblTransactions tbody').empty();

        $('.ui-popup-container').empty().remove();
        $('.ui-popup-screen').empty().remove();
        $('#email').remove();
        $('password').remove();
        
        this.render('login_v2', {}).then((template) => {
            this.activePopup = $(template).popup({
                history: false,
                overlayTheme: 'b'
            }); 
            
            this.activePopup.popup('open');

            $('#btnSignIn').off('click').on('click', self.handleLogin.bind(self));

            function handleEnter(e: JQuery.Event<HTMLElement, null>) {
                if (e.keyCode == 13) {
                    self.handleLogin();
                }
            }
    
            $('#username').off('keypress').on('keypress', handleEnter);
            $('#password').off('keypress').on('keypress', handleEnter);
        });
    }

    async handleLogin() {
        let credentials;

        function login_flash(message: string) {
            $('#errors').text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
        }

        try {
            credentials = await this.application.login($('#email').val().toString(), $('#password').val().toString());
            this.activePopup.popup('close').empty().remove();
        } catch (error) {
            switch (error.code) {
                case 'auth/user-disabled':
                    login_flash("Account Disabled");
                    break;
                case 'auth/invalid-email':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    login_flash("Invalid Login");
                    $('#password').val('');
                    $('#email').focus().select();
                    break;
                default:
                    console.log(error);
                    login_flash("Unknown Error");
                    break;
            }
        }
    }

    loading() {
        $.mobile.loading();
    }

    doneLoading() {
        $.mobile.loading('hide');
    }

    getRow(e: JQuery.Event) : JQuery<HTMLElement> {
        let target = $(e.target);

        return target.is('tr') ? target : target.parent('tr');
    }

    updateTransaction(transaction: TransactionStructure) {
        console.log('UPDATING FROM:', transaction);

        this.render('singletransaction', { 
            item: transaction,
            hasNote: (typeof transaction.note !== "undefined")
        }).then((template) => {
            // inserting a new transaction into the table
            console.log('Inserting new row');

            // make sure any originals are deleted
            $('#' + transaction.id).remove();

            // add the transaction
            $('#tblTransactions tbody').append($(template));

            // resort the table
            this.sortTransactions();
        });
    }

    sortTransactions() {
        let rows = $('#tblTransactions tbody tr');
        let rowArray = rows.toArray();

        rows.remove();

        rowArray.sort((a, b) => {
            let aName = $(a).attr('name'), bName = $(b).attr('name');
            let aCat = this.application.Categories.indexOf($(a).attr('category')), bCat = this.application.Categories.indexOf($(b).attr('category'));

            if (aCat != bCat) return aCat - bCat;
            if (aName > bName) return 1;
            if (aName < bName) return -1;
            return 0;
        });

        $('#tblTransactions tbody').append(rowArray);

        // redecorate the row shading
        let n = 0;
        let category: string;

        rows = $('#tblTransactions tbody tr');
        rows.removeClass('row_0').removeClass('row_1');
        category = rows.first().attr('category');

        rows.each((idx, row) => {
            if ($(row).attr('category') !== category) {
                category = $(row).attr('category');
                n = 1 - n;
            }
            $(row).addClass('row_' + n);
        });
        

        // update handlers
        $('#tblTransactions tbody tr')
            .off('mouseover').on('mouseover', this.transaction_OnMouseOver.bind(this))
            .off('mouseout').on('mouseout', this.transaction_OnMouseOut.bind(this))
            .off('click').on('click', this.transaction_Click.bind(this))
            .off('dblclick').on('dblclick', this.transaction_DblClick.bind(this));
    }

    updateTotal(total: number) {
        $('#total_calc').text(total.toCurrency());
    }

    async updateTransactions(items : Array<TransactionStructure>) {
        let promises = new Array<Promise<void>>();
        $('#tblTransactions tbody').empty();
        this.periodMenu.val(this.application.m_periodStart);
        this.periodMenu.selectmenu('refresh');

        for (var transaction of items) {
            promises.push(this.render('singletransaction', { item: transaction }).then((template) => {
                $('#tblTransactions tbody').append($(template));
            }));
        }

        Promise.all(promises).then(() => {
            this.sortTransactions();
            this.doneLoading();
        });

        this.updateTotal(await this.application.getPeriodSum());
    }

    transaction_OnMouseOver(e: JQuery.Event) {
        $('#tblTransactions tbody tr').css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
    }

    transaction_OnMouseOut() {
        $('#tblTransactions tbody tr').css('background-color', '');
    }

    async transaction_DblClick(e: JQuery.Event) {
        e.preventDefault();
        var id : string = this.getRow(e).attr('id');

        this.editTransaction(id);
    }

    async transaction_Click(e: JQuery.Event) {
        e.preventDefault();
        var id : string = this.getRow(e).attr('id');
        
        // get the transaction previews
        var item = await this.application.getTransaction(id);

        if (item !== null) {
            // select this transaction for the editor
            this.btnEditTransaction.prop('targetId', id); 

            var items = await this.application.getSameTransactions(item);
            this.render('info_v2', { title: item.name, items: items }).then((template) => {
                $('.info_div').empty().append($(template));

                // TODO: add the ability to jump to a transaction
            });
        }
    }

    async editTransaction(id: string) {
        let transaction = await this.application.getTransaction(id);
        console.log(transaction);
        this.render('edittransaction_v2', transaction).then((template) => {
            this.activePopup = $(template).popup({
                history: false,
                overlayTheme: 'b'               
            });
            this.activePopup.on('popupafteropen', async () => {
                $('#btnSave').on('click', async () => {
                    // collect the updated data
                    let isDeposit = $("#type").prop('checked') as boolean;

                    transaction.date = $('#date').val().toString();
                    transaction.category = $('#category').val().toString();
                    transaction.name = $('#name').val().toString();
                    transaction.amount = ($('#amount').val() as number) * (isDeposit ? 1 : -1);
                    transaction.cash = ($('#cash').prop('checked') as boolean) && (isDeposit == false);
                    transaction.transfer = $('#transfer').prop('checked') as boolean;
                    transaction.paid = $('#paid').prop('checked') as boolean;
                    transaction.note = $('#note').val().toString();
                    transaction.check = $('#checkNumber').val().toString();
                    transaction.checkLink = $('#checkLink').val().toString();                    

                    // save the transaction
                    await this.application.saveTransaction(transaction);

                    // close the dialog
                    this.activePopup.popup('close');
                });
                $('#btnDelete').on('click', () => {
                    // delete the transaction

                    // close the dialog
                    this.activePopup.popup('close');
                });
                $('#transactionEditor input').on('keypress', (e) => {
                    if (e.charCode == 13) {
                        e.preventDefault();
                        $('#btnSave').click();
                    }
                });
            });
            this.activePopup.on('popupafterclose', () => {
                $('.ui-popup-container').remove();
            });
            this.activePopup.popup('open');
        });
    }

    
}