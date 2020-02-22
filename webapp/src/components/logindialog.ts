import Dialog from "./dialog";
import Spinner from "./spinner";
import ForgotPasswordDialog from "./forgotpassworddialog";

type LoginMethod = (username: string, password: string) => Promise<void>;
type ResetMethod = (username: string) => void;
type SignupMethod = () => void;

export default class LoginDialog extends Dialog {
    private login: LoginMethod = async () => {};
    private reset: ResetMethod;
    private signup: SignupMethod;

    constructor(login: LoginMethod, reset?: ResetMethod, signup?: SignupMethod) {
        super('login_v2');
        this.login = login;
        this.reset = reset;
        this.signup = signup;
    }

    private decodeQueryString() : {[key:string]:string} {
        let result: {[key:string]:string} = {};
        if (location.search) {
            let parts = location.search.split(/[\?&]/g).filter(s => s.length > 0);
            let re = /([^=]+)(?:\=(.*))?/;
            for (let part of parts) {
                let [capture, key, value] = re.exec(part);
                if (value) {
                    value = decodeURIComponent(value);
                } else {
                    value = null;
                }
                result[key] = value;
            }
        }
        return result;
    }

    afterOpen() {
        Spinner.hide();

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

        this.m_dialog.find('#btnSignIn').on('click', async () => {
            let flash = this.m_dialog.find('#errors');

            function login_flash(message: string) {
                flash.text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }

            try {
                await this.login(this.m_dialog.find('#email').val().toString(), this.m_dialog.find('#password').val().toString());
                Spinner.show();
                this.close();
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
                this.m_dialog.find('#password').val('');
                this.m_dialog.find('#email').select().focus();
            }
        });

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