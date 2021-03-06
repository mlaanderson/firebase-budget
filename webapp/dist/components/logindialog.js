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
class LoginDialog extends dialog_1.default {
    constructor(login, reset, signup) {
        super('login_v2');
        this.login = () => __awaiter(this, void 0, void 0, function* () { });
        this.login = login;
        this.reset = reset;
        this.signup = signup;
    }
    decodeQueryString() {
        let result = {};
        if (location.search) {
            let parts = location.search.split(/[\?&]/g).filter(s => s.length > 0);
            let re = /([^=]+)(?:\=(.*))?/;
            for (let part of parts) {
                let [capture, key, value] = re.exec(part);
                if (value) {
                    value = decodeURIComponent(value);
                }
                else {
                    value = null;
                }
                result[key] = value;
            }
        }
        return result;
    }
    afterOpen() {
        spinner_1.default.hide();
        let query = this.decodeQueryString();
        if ('email' in query) {
            this.m_dialog.find('#email').val(query.email);
        }
        if (!this.signup) {
            this.m_dialog.find('#createAccount').hide();
        }
        if (!this.reset) {
            this.m_dialog.find('#forgotPassword').hide();
        }
        this.m_dialog.find('#btnSignIn').on('click', () => __awaiter(this, void 0, void 0, function* () {
            let flash = this.m_dialog.find('#errors');
            function login_flash(message) {
                flash.text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }
            try {
                yield this.login(this.m_dialog.find('#email').val().toString(), this.m_dialog.find('#password').val().toString());
                spinner_1.default.show();
                this.close();
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
                this.m_dialog.find('#password').val('');
                this.m_dialog.find('#email').select().focus();
            }
        }));
        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.keyCode == 13) {
                this.m_dialog.find('#btnSignIn').click();
            }
        });
        this.m_dialog.find('#createAccount').on('click', (e) => {
            e.preventDefault();
            this.close();
            this.signup();
        });
        this.m_dialog.find('#forgotPassword').on('click', (e) => {
            e.preventDefault();
            this.reset(this.m_dialog.find('#email').val().toString());
            this.close();
        });
    }
}
exports.default = LoginDialog;
