import Dialog from "./dialog";
import Spinner from "./spinner";


export default class LoginDialog extends Dialog {
    private login: (username: string, password: string) => void = async () => {};

    constructor(login: (username: string, password: string) => void) {
        super('login_v2');
        this.login = login;        
    }

    afterOpen() {
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
    }
}