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
const wizard_1 = require("./components/wizard");
require("firebase/database");
function ShowIntroWizard(config) {
    ['navigationBar.png', 'addButton.png', 'newTransaction.png', 'newRecurring.png', 'workspace_overview_mobile.png', 'workspace_overview_desktop.png'].map(img => $(`<img src="/images/introWizard/${img}/>"`));
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let pages = yield config.root.child('tutorials/intro').once('value');
        let wizard = new wizard_1.default(pages.val());
        let budgetStart, budgetPeriod;
        wizard.on('done', () => __awaiter(this, void 0, void 0, function* () {
            yield config.child('showWizard').set(false);
            resolve();
        }));
        wizard.on('beforepage', (id, idx) => __awaiter(this, void 0, void 0, function* () {
            if (id == 'setupScreen') {
                budgetStart = $('[name=budgetStart]').val().toString();
                budgetPeriod = $('[name=budgetPeriod]').val().toString();
                yield config.child('periods').set({
                    start: budgetStart,
                    length: budgetPeriod
                });
            }
        }));
        wizard.on('page', (id, idx) => {
            if (id == 'setupScreen') {
                $('[name=budgetPeriod]').on('validity', (e) => {
                    $('.wizardNextButton').attr('disabled', !$('[name=budgetPeriod').timespan('valid'));
                });
            }
        });
        wizard.open();
    }));
}
exports.default = ShowIntroWizard;
