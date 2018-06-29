import Wizard, { WizardBlock, WizardPage } from "./components/wizard";
import * as firebase from "firebase/app";
import "firebase/database";

export default function ShowIntroWizard(config: firebase.database.Reference) {
    ['navigationBar.png', 'addButton.png', 'newTransaction.png', 'newRecurring.png', 'workspace_overview_mobile.png', 'workspace_overview_desktop.png'].map(img => $(`<img src="/images/introWizard/${img}/>"`));
    return new Promise(async (resolve, reject) => {
        let pages = await config.root.child('tutorials/intro').once('value');
        let wizard = new Wizard(pages.val());
        let budgetStart: string, budgetPeriod: string;

        wizard.on('done', async () => {
            await config.child('showWizard').set(false);
            resolve();
        });

        wizard.on('beforepage', async (id, idx) => {
            if (id == 'setupScreen') {
                budgetStart = $('[name=budgetStart]').val().toString();
                budgetPeriod = $('[name=budgetPeriod]').val().toString();

                await config.child('periods').set({
                    start: budgetStart,
                    length: budgetPeriod
                });
            }
        });

        wizard.on('page', (id, idx) => {
            if (id == 'setupScreen') {
                $('[name=budgetPeriod]').on('validity', (e) => {
                    $('.wizardNextButton').attr('disabled', !$('[name=budgetPeriod').timespan('valid'));
                });
            }
        });

        wizard.open();
    });
}