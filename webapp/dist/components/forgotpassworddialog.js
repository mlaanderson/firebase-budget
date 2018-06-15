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
class ForgotPasswordDialog extends dialog_1.default {
    constructor(sendreset, username) {
        super('forgotpassword');
        this.sendreset = () => __awaiter(this, void 0, void 0, function* () { });
        this.sendreset = sendreset;
        this.username = username;
    }
    afterOpen() {
        this.m_dialog.find('#email').val(this.username || '');
        spinner_1.default.hide();
        this.m_dialog.find('#btnRetrieve').on('click', () => __awaiter(this, void 0, void 0, function* () {
            let flash = this.m_dialog.find('#errors');
            function login_flash(message) {
                flash.text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }
            try {
                let username = this.m_dialog.find('#email').val().toString();
                spinner_1.default.show();
                this.close();
                this.sendreset(username);
            }
            catch (error) {
                switch (error.code) {
                    case 'auth/invalid-email':
                    case 'auth/user-not-found':
                        login_flash("Invalid Account");
                        $('#email').focus().select();
                        break;
                    default:
                        console.log(error);
                        login_flash("Unknown Error");
                        break;
                }
                this.m_dialog.find('#email').select().focus();
            }
        }));
        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.keyCode == 13) {
                this.m_dialog.find('#btnSignIn').click();
            }
        });
    }
}
exports.default = ForgotPasswordDialog;
