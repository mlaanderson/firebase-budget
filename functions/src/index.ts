import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AsyncResource } from 'async_hooks';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp();

 function today() : Date {
    var d = new Date(Date.now());
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function formatDate(date: Date) {
    return date.getUTCFullYear() + "-" + (date.getUTCMonth() < 9 ? "0" + 
    (date.getUTCMonth() + 1) : date.getUTCMonth() + 1) + "-" + 
    (date.getUTCDate() < 10 ? "0" : "") + date.getUTCDate();
}

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
                start: formatDate(today()),
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

exports.createUser = functions.auth.user().onCreate(setupUser);
exports.removeUser = functions.auth.user().onDelete(removeUserData);