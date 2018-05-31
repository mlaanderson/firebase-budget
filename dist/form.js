"use strict";
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="./ejs.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/number.ext");
require("./lib/input.ext");
class Form {
    constructor(app) {
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
    window_Resize(e) {
        this.main.css('max-height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
        this.main.css('height', ($(window).height() - this.header.height() - this.footer.height() - 4).toString() + 'px');
    }
    periodMenu_Change(e) {
    }
    main_MouseOut(e) {
        setTimeout(() => {
            this.btnEditTransaction.prop('targetId', '');
        }, 150);
    }
    btnLogout_Click(e) {
        e.preventDefault();
        this.application.signout().then(this.clear.bind(this));
    }
    btnPrev_click(e) {
        e.preventDefault();
        this.application.backOne().then(this.updateTransactions);
    }
    btnNext_click(e) {
        e.preventDefault();
        this.application.forwardOne().then(this.updateTransactions);
    }
    btnCash_click(e) { }
    btnReport_click(e) { }
    btnTransfer_click(e) { }
    btnAddTransaction_click(e) { }
    btnEditTransaction_click(e) { }
    btnNewRecurring_click(e) { }
    btnDownload_click(e) { }
    btnConfig_click(e) { }
    render(path, data) {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path, data, (template) => {
                resolve(template);
            });
        });
    }
    /**
     * Clears the account data from the form
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
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
                function handleEnter(e) {
                    if (e.keyCode == 13) {
                        self.handleLogin();
                    }
                }
                $('#username').off('keypress').on('keypress', handleEnter);
                $('#password').off('keypress').on('keypress', handleEnter);
            });
        });
    }
    handleLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            let credentials;
            function login_flash(message) {
                $('#errors').text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }
            try {
                credentials = yield this.application.login($('#email').val().toString(), $('#password').val().toString());
                this.activePopup.popup('close').empty().remove();
            }
            catch (error) {
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
        });
    }
    loading() {
        $.mobile.loading();
    }
    doneLoading() {
        $.mobile.loading('hide');
    }
    getRow(e) {
        let target = $(e.target);
        return target.is('tr') ? target : target.parent('tr');
    }
    updateTransaction(transaction) {
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
            if (aCat != bCat)
                return aCat - bCat;
            if (aName > bName)
                return 1;
            if (aName < bName)
                return -1;
            return 0;
        });
        $('#tblTransactions tbody').append(rowArray);
        // redecorate the row shading
        let n = 0;
        let category;
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
    updateTotal(total) {
        $('#total_calc').text(total.toCurrency());
    }
    updateTransactions(items) {
        return __awaiter(this, void 0, void 0, function* () {
            let promises = new Array();
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
            // this.render('transaction_v2', {items: items}).then((template) => {
            //     $('#tblTransactions tbody').append($(template));
            //     this.window_Resize(null);
            //     // handle the highlighting
            //     $('#tblTransactions tbody tr')
            //         .on('mouseover', this.transaction_OnMouseOver.bind(this))
            //         .on('mouseout', this.transaction_OnMouseOut.bind(this));
            //     // handle the editing
            //     $('#tblTransactions tbody tr').on('click', this.transaction_Click.bind(this));
            //     $('#tblTransactions tbody tr').on('dblclick', this.transaction_DblClick.bind(this));
            // });
            this.updateTotal(yield this.application.getPeriodSum());
        });
    }
    transaction_OnMouseOver(e) {
        $('#tblTransactions tbody tr').css('background-color', '');
        this.getRow(e).css('background-color', '#eef');
    }
    transaction_OnMouseOut() {
        $('#tblTransactions tbody tr').css('background-color', '');
    }
    transaction_DblClick(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            var id = this.getRow(e).attr('id');
            this.editTransaction(id);
        });
    }
    transaction_Click(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            var id = this.getRow(e).attr('id');
            // get the transaction previews
            var item = yield this.application.getTransaction(id);
            if (item !== null) {
                // select this transaction for the editor
                this.btnEditTransaction.prop('targetId', id);
                var items = yield this.application.getSameTransactions(item);
                this.render('info_v2', { title: item.name, items: items }).then((template) => {
                    $('.info_div').empty().append($(template));
                    // TODO: add the ability to jump to a transaction
                });
            }
        });
    }
    editTransaction(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let transaction = yield this.application.getTransaction(id);
            console.log(transaction);
            this.render('edittransaction_v2', transaction).then((template) => {
                this.activePopup = $(template).popup({
                    history: false,
                    overlayTheme: 'b'
                });
                this.activePopup.on('popupafteropen', () => __awaiter(this, void 0, void 0, function* () {
                    $('#btnSave').on('click', () => __awaiter(this, void 0, void 0, function* () {
                        // collect the updated data
                        let isDeposit = $("#type").prop('checked');
                        transaction.date = $('#date').val().toString();
                        transaction.category = $('#category').val().toString();
                        transaction.name = $('#name').val().toString();
                        transaction.amount = $('#amount').val() * (isDeposit ? 1 : -1);
                        transaction.cash = $('#cash').prop('checked') && (isDeposit == false);
                        transaction.transfer = $('#transfer').prop('checked');
                        transaction.paid = $('#paid').prop('checked');
                        transaction.note = $('#note').val().toString();
                        transaction.check = $('#checkNumber').val().toString();
                        transaction.checkLink = $('#checkLink').val().toString();
                        // save the transaction
                        yield this.application.saveTransaction(transaction);
                        // close the dialog
                        this.activePopup.popup('close');
                    }));
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
                }));
                this.activePopup.on('popupafterclose', () => {
                    $('.ui-popup-container').remove();
                });
                this.activePopup.popup('open');
            });
        });
    }
}
exports.default = Form;
