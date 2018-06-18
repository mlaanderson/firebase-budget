import Dialog from "./dialog";
import Spinner from "./spinner";
import ForgotPasswordDialog from "./forgotpassworddialog";

type SignupMethod = (username: string, password: string) => void;

export default class SignUpDialog extends Dialog {
    private signup: SignupMethod;

    constructor(signup: SignupMethod) {
        super('signup');
        this.signup = signup;
    }

    afterOpen() {
        Spinner.hide();
        this.m_dialog.find('#registerEmail').val('').focus();
        this.m_dialog.find('#registerPassword').val('');

        this.m_dialog.find('#btnSignUp').on('click', async () => {
            let flash = this.m_dialog.find('#errors');

            function login_flash(message: string) {
                flash.text(message).slideUp(0).slideDown(300).delay(1500).slideUp(300);
            }

            try {
                await this.signup(this.m_dialog.find('#registerEmail').val().toString(), this.m_dialog.find('#registerPassword').val().toString());
                Spinner.show();
                this.close();
            } catch (error) {
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
        });

        this.m_dialog.find('input').on('keypress', (e) => {
            if (e.keyCode == 13) {
                this.m_dialog.find('#btnSignUp').click();
            }
        });
    }
}