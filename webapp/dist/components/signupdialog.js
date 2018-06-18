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
class SignUpDialog extends dialog_1.default {
    constructor(signup) {
        super('signup');
        this.signup = signup;
    }
    afterOpen() {
        spinner_1.default.hide();
        this.m_dialog.find('#registerEmail').val('').focus();
        this.m_dialog.find('#registerPassword').val('');
        this.m_dialog.find('#btnSignUp').on('click', () => __awaiter(this, void 0, void 0, function* () {
            let flash = this.m_dialog.find('#errors');
            function login_flash(message) {
                flash.text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }
            try {
                spinner_1.default.show();
                yield this.signup(this.m_dialog.find('#registerEmail').val().toString(), this.m_dialog.find('#registerPassword').val().toString());
                this.close();
            }
            catch (error) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        login_flash("Email Already Registered");
                        break;
                    case 'auth/invalid-email':
                        login_flash("Invalid Email");
                        $('#registerPassword').val('');
                        $('#registerEmail').focus().select();
                        break;
                    case 'auth/weak-password':
                        login_flash('Weak Password');
                        $('#registerPassword').val('').focus();
                        break;
                    default:
                        console.log(error);
                        login_flash("Unknown Error");
                        break;
                }
                this.m_dialog.find('#registerPassword').val('');
                this.m_dialog.find('#registerEmail').select().focus();
            }
        }));
        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.keyCode == 13) {
                this.m_dialog.find('#btnSignUp').click();
            }
        });
    }
}
exports.default = SignUpDialog;
