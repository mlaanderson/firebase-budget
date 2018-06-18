import Dialog from "./dialog";
import Spinner from "./spinner";


export default class ForgotPasswordDialog extends Dialog {
    private sendreset: (username: string) => void = async () => {};
    private username: string;

    constructor(sendreset: (username: string) => void, username?:string) {
        super('forgotpassword');
        this.sendreset = sendreset;        
        this.username = username;
    }

    afterOpen() {
        this.m_dialog.find('#email').val(this.username || '');
        Spinner.hide();
        this.m_dialog.find('#btnRetrieve').on('click', async () => {
            let flash = this.m_dialog.find('#errors');

            function login_flash(message: string) {
                flash.text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }

            try {
                let username = this.m_dialog.find('#email').val().toString();
                Spinner.show();
                this.close();
                this.sendreset(username);
            } catch (error) {
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
        });

        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.keyCode == 13) {
                this.m_dialog.find('#btnSignIn').click();
            }
        });
    }
}