module.exports = [
    {
        "title": "Welcome to the Budget",
        "backDisabled": true,
        "contents": [
            `Welcome to the online budget. This short wizard will introduce you to the app.`,

            `<h4>Budget Workspace</h4>`,

            { type: 'image', data: '/images/introWizard/workspace_overview_<%= mobile() ? "mobile" : "desktop" %>.png' },

            `The navigation bar at the bottom left allows you to move between pay periods.`,
            
            `The <%= mobile() ? "Edit Transaction and" : "" %> Add Transaction button<%= mobile() ? "s" : "" %> 
            manage individual transaction editing.`,
            
            `The Add Recurring button allows recurring transactions to be created.`,

            `The Menu button brings up a menu to the left for searching, getting cash and transfer reports, undoing or 
            redoing changes, viewing charts, changing settings, downloading your data, and logging out.`
        ]
    },

    {
        title: "Transactions",
        contents: [
            `<div style="min-height: 500px"><img src="/images/introWizard/newTransaction.png" style="float: right; margin: 0 0 0 5px; max-height: 500px; max-width: 40%;">
            Transactions are the line items in your budget. The transaction dialog box is where the details of the transaction are entered. 
            <ul>
                <li>Enter the date of the transaction.</li>
                <li>Select a category for the transaction.</li>
                <li>Give the it a name.</li>
                <li>Determine if it is a deposit or withdrawal</li>
                <li>Determine if you will withdraw cash for this expense, or pay it another way.</li>
                <li>Determine if this is to be a transfer into or out of savings.</li>
                <li>Enter a check number if needed.</li>
                <li>Enter the amount of the transaction. Always use a positive number.</li>
                <li>Check the "Paid" box when the transaction has come out of your account.</li>
                <li>Add any notes you might want.</li>
                <li>Click "Save Changes" to add the transaction.</li>
            </ul>
            To edit a transaction, <%= mobile() ? "tap on the transaction to select it, then tap the edit transaction button." : "double click on the transaction in the list." %>
            </div>`
        ]
    },

    {
        title: "Recurring Transactions",
        contents: [
            `Recurring Transactions help with the entry of transactions that are usually the same. The
            recurring transaction dialog is very similar to the regular transaction dialog. The differences
            are shown below:`,
            
            { type: 'image', data: '/images/introWizard/newRecurring.png' },

            `A recurring transaction has a period, a start date, and an end date. If you buy groceries every 
            two weeks, you would enter "2 weeks" into the period. Then pick the next time you will buy groceries
            as the starting date. Finally, pick a point in the future when you might adjust that budget as the 
            end. The end will default to one year from today.`,

            `To edit a recurring transaction, <%= mobile() ? "tap" : "click" %> on the recurring transaction
            icon next to the transaction name in the list. Changes will only apply from today's date or
            the current pay period, whichever is later.`
        ]
    },

    {
        title: "Dialogs",
        contents: [
            `The dialogs for editing transactions, changing settings, viewing reports and charts can all be
            dismissed without making changes by <%= mobile() ? 'tapping' : 'clicking' %> outside of the dialog.`
        ]
    },

    // Have the user pick their start date and period
    {
        id: "setupScreen",
        title: "Setup",
        contents: [
            `In the box below, select the date of the first payday for your budget. That
            could be your next payday, or your last payday.`,
            `<div class="ui-field-contain"><input type="date" name="budgetStart" value="<%= Date.next(Date.WeekDays.Friday).toFbString() %>" data-theme="a"></div>`,
            `Next, enter in the time between your paychecks. Common periods will be "1 week", 
            "2 weeks", "1 month", "1st and 15th". The input box will indicate an error if you enter an invalid period.`,
            `<div class="ui-field-contain"><input type="text" name="budgetPeriod" data-role="timespan" value="2 weeks" data-theme="a"></div>`
        ],
        nextText: "Save"
    },

    // Complete - set the next button text to "Done"
    {
        title: "Done!",
        contents: [
            `Your budget is ready to start!`,

            `Thank you for using the Budget app.`
        ],
        nextText: 'Done'
    }
]