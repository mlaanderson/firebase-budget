import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AsyncResource } from 'async_hooks';
import '../../webapp/src/lib/date.ext';
import '../../webapp/src/lib/number.ext';
import '../../webapp/src/lib/math.ext';
import { database, EventContext, Change } from 'firebase-functions';
import RecurringTransaction from '../../webapp/src/models/recurringtransaction';
import Transaction from '../../webapp/src/models/transaction';

admin.initializeApp();

async function setupUser(user: admin.auth.UserRecord, context: functions.EventContext) {
    let uid = user.uid;
    let userRef = admin.database().ref(uid);
    
    await userRef.set({
        name: 'Live',
        email: user.email,
        config: {
            showWizard: true,
            categories: ['Income', 'Charity', 'Saving', 'Housing', 'Utilities', 'Food', 'Clothing', 'Transportation', 'Medical', 'Personal', 'Education', 'Recreation', 'Debt'],
            periods : {
                start: Date.today().toFbString(),
                length: '2 weeks'
            }
        },
        accounts: {
            budget: {
                name: 'Primary'
            }
        }
    });
}

async function removeUserData(user: admin.auth.UserRecord, context: functions.EventContext) {
    let uid = user.uid;

    admin.database().ref(uid).remove();
}

async function handleRecurring(change: Change<database.DataSnapshot>, context: EventContext) : Promise<boolean> {
    let transaction = change.after.val() as RecurringTransaction;
    if (transaction) {
        if (transaction.active) {
            // this is a tagged recurring, handle it on the server
            let date = Date.parseFb(transaction.start);
            let trRef = change.after.ref.parent.parent.child('transactions');

            // remove the change key
            await change.after.ref.child('active').remove();

            // remove the old transactions
            let snapshot = await trRef.orderByChild('date').startAt(transaction.active).once('value');
            let values = snapshot.val();
            for (let key in values) {
                if (values[key].recurring == change.after.key)
                    await snapshot.child(key).ref.remove();
            }

            do {
                if (date.toFbString() >= transaction.active) {
                    // create a new transaction
                    await trRef.push({
                        amount: transaction.amount,
                        cash: transaction.cash || null,
                        category: transaction.category,
                        date: date.toFbString(),
                        name: transaction.name,
                        note: transaction.note || null,
                        recurring: change.after.key,
                        transfer: transaction.transfer || null,
                        scheduled: transaction.scheduled || null
                    });
                }
                date = date.add(transaction.period);
            } while (date.toFbString() <= transaction.end);

            return true;
        } else if (transaction.delete) {
            let trRef = change.after.ref.parent.parent.child('transactions');
            let snapshot = await trRef.orderByChild('date').startAt(transaction.delete).once('value');
            let values = snapshot.val();
            for (let key in values) {
                if (values[key].recurring == change.after.key)
                    await snapshot.child(key).ref.remove();
            }

            await change.after.ref.child('delete').remove();

            return true;
        }
    }
    return false;
}

exports.handleRecurring = functions.database.ref('/{user}/accounts/{account}/recurring/{key}').onWrite(handleRecurring);
exports.createUser = functions.auth.user().onCreate(setupUser);
exports.removeUser = functions.auth.user().onDelete(removeUserData);
