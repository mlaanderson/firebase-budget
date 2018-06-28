module.exports = [
    {
        "title": "Welcome to the Budget",
        "backDisabled": true,
        "contents": [
            `Welcome to the online budget. This short wizard will introduce you to the app.`,

            `You can sign into your budget in most browsers by going to 
            <a href="https://budget-dacac.firebaseapp.com">https://budget-dacac.firebaseapp.com</a>. 
            If you are signed in from multiple computers or mobile devices, every login will see 
            changes as they occur. This can be very helpful when two or more people are working 
            on the budget.`
        ]
    },
    {
        title: "Near Zero Sum Budgetting",
        contents: [
                `This application is geared towards zero sum budgetting. Your money should be working for you,
                the amount left over at the end of each pay period should be close to zero. Even money to be 
                saved will be accounted for and included in the budget.`,

                `Since many people are not comfortable with their account getting close to zero,
                we use the "nearly zero" method. Aim to have just a comforatble minimum left
                over at the end of the pay period. Every other dollar will be working for you.`,

                `This application will work even if you don't employ the "near zero sum" method
                of budgetting. As you save, you will see the balance chart at the bottom of the
                screen continue to grow.`
        ]
    },
    {
        title: "Getting Started - Navigation",
        contents: [
            `There are a few critical parts of the page to know about before starting your new
            budget.`,

            `The navigation bar allows you to move between pay periods. You will find it
            in the bottom right corner of the screen.`,

            { type: 'image', data: '/images/introWizard/navigationBar.png'},

            `The button with a "Clock" icon will take you to today's pay period. The left arrow 
            will go to the previous pay period, the right arrow will take you to the next pay
            period. The button with the dates and a calendar icon allows you to select a pay
            period to go to.`
        ]
    },
    {
        title: "Getting Started - Transactions",
        contents: [
            `Transactions are the fundamental piece of information in the budget. Every line 
            item is a transaction. You add a new transaction by clicking on the "Add Transaction"
            button in the upper right hand corner of the screen.`,

            { type: 'image', data: '/images/introWizard/addButton.png' },

            `Click on the "Add Transaction" button to create a new transaction. If you decide not to
            create a new transaction, just click on the screen outside of the dialog box that pops
            up.`
        ]
    },
    {
        title: "Getting Started - Transactions",
        contents: [
            `<div style="min-height: 500px"><img src="/images/introWizard/newTransaction.png" style="float: right; margin: 0 0 0 5px; max-height: 500px; max-width: 40%;">
            The transaction dialog box is where the details of the transaction are entered. 
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
            To edit a transaction, <%= $('#footer_info').css('display') == 'none' ? "tap on the transaction to select it, then tap the edit transaction button." : "double click on the transaction in the list." %>
            </div>`
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