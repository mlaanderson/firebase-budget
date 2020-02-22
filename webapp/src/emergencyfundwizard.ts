import Wizard, { WizardBlock, WizardPage } from "./components/wizard";
import BudgetForm from "./viewer";
import Spinner from "./components/spinner";


export default function showEmergencyFundWizard(viewer: BudgetForm) {
        
    var pages: WizardPage[] = [
        {
            "id": "entry",
            "title": "Setup an Emergency Fund",
            "backDisabled": true,
            "contents": [
                `An emergency fund is simply money set aside for an emergency.This 
                wizard will help you save up an emergency fund as quickly as possible.`,

                `How much do you want to save?`,

                `<div class="ui-field-contain"><input type="number" name="target" value="1000.00" data-theme="a"></div>`,

                `What is the minimum amount you want left over in each pay period?`,

                `<div class="ui-field-contain"><input type="number" name="minBalance" value="20.00" data-theme="a"></div>`,

                `What category should the emergency fund go into?`,

                `<div class="ui-field-contain"><select data-theme="a" name="category">${viewer.budget.Config.categories.map(n => `<option value=${n}>${n}</option>`)}</select></div>`,

                `What name should the emergency fund transactions have?`,

                `<div class="ui-field-contain"><input type="text" name="name" value="Emergency Fund" data-theme="a"></div>`
            ]
        },
        {
            "id": "summary",
            "title": "Setup an Emergency Fund",
            "nextText": "Create Transactions",
            "nextDisabled": true,
            "backDisabled": true,
            "contents": [
                '<span id="waiting">Calculating...</span>',
                { type: 'image', data: '/jquery.mobile/css/themes/default/images/ajax-loader.gif' }
            ]
        }
    ];

    let wizard = new Wizard(pages, true);
    let target = 0;
    let minBalance = 0;
    let category = "";
    let name = "";
    let amounts = new Array<{date: Date, amount: number}>();
    let budget = viewer.budget;
    let startDate = Date.min(Date.parseFb(budget.Transactions.Start), Date.periodCalc(budget.Config.start, budget.Config.length));

    wizard.on('beforepage', (id, idx) => {
        switch (id) {
            case 'entry':
                target = parseFloat($('[name=target]').val() as string);
                minBalance = parseFloat($('[name=minBalance]').val() as string);
                category = $('[name=category]').val() as string;
                name = $('[name=name]').val() as string;
            break;
            case 'summary': 
                // the user has said to go ahead and create the transactions
                if (amounts.length > 0) {
                    for (let amount of amounts) {
                        viewer.budget.saveTransaction({
                            amount: -amount.amount,
                            cash: true,
                            category: category,
                            date: amount.date.toFbString(),
                            name: name
                        });
                    }
                }
            break;
        }
    });

    wizard.on('page', async (id, idx) => {
        switch(id) {
            case 'summary':
                viewer.turnOffUpdates();
                Spinner.show();
                let date = startDate;
                let balance = target;
                let balanceOffset = 0;
                let n = 0;
                amounts = [];

                while ((balance > 0) && (n++ < 50)) {
                    await budget.gotoDate(date);
                    let periodTotal = await budget.Transactions.getTotal();

                    if ((periodTotal - balanceOffset) > minBalance) {
                        let entry = {
                            date: date,
                            amount: Math.min(balance, periodTotal - balanceOffset - minBalance)
                        };
                        balance -= entry.amount;
                        balanceOffset += entry.amount;

                        amounts.push(entry);
                    } 

                    date = date.add(budget.Config.length);

                }
                Spinner.hide();
                wizard.content.empty();
                
                viewer.turnOnUpdates();
                await budget.gotoDate(startDate);

                if (amounts.map(v => v.amount).reduce((pv, cv) => cv + pv, 0) != target) {
                    amounts = [];
                }

                if (amounts.length > 0) {
                    for (let amount of amounts) {
                        wizard.content.append($(`<p>${amount.date.format('MMM d, yyyy')}: ${amount.amount.toCurrency()}</p>`));
                    }
                    wizard.NextEnabled = true;
                } else {
                    wizard.content.append($('<p>Your goal cannot be accomplished in less than five years. Try again?</p>'))
                }
                wizard.BackEnabled = true;
            break;
        }
    });

    wizard.open();
}

