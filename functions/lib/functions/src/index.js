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
const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("../../webapp/src/lib/date.ext");
require("../../webapp/src/lib/number.ext");
require("../../webapp/src/lib/math.ext");
admin.initializeApp();
function setupUser(user, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let uid = user.uid;
        let userRef = admin.database().ref(uid);
        yield userRef.set({
            name: 'Live',
            email: user.email,
            config: {
                showWizard: true,
                categories: ['Income', 'Charity', 'Saving', 'Housing', 'Utilities', 'Food', 'Clothing', 'Transportation', 'Medical', 'Personal', 'Education', 'Recreation', 'Debt'],
                periods: {
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
    });
}
function removeUserData(user, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let uid = user.uid;
        admin.database().ref(uid).remove();
    });
}
function handleRecurring(change, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let transaction = change.after.val();
        if (transaction) {
            if (transaction.active) {
                // this is a tagged recurring, handle it on the server
                let date = Date.parseFb(transaction.start);
                let trRef = change.after.ref.parent.parent.child('transactions');
                // remove the change key
                yield change.after.ref.child('active').remove();
                // remove the old transactions
                let snapshot = yield trRef.orderByChild('date').startAt(transaction.active).once('value');
                let values = snapshot.val();
                for (let key in values) {
                    if (values[key].recurring == change.after.key)
                        yield snapshot.child(key).ref.remove();
                }
                do {
                    if (date.toFbString() >= transaction.active) {
                        // create a new transaction
                        yield trRef.push({
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
            }
            else if (transaction.delete) {
                let trRef = change.after.ref.parent.parent.child('transactions');
                let snapshot = yield trRef.orderByChild('date').startAt(transaction.delete).once('value');
                let values = snapshot.val();
                for (let key in values) {
                    if (values[key].recurring == change.after.key)
                        yield snapshot.child(key).ref.remove();
                }
                yield change.after.ref.child('delete').remove();
                return true;
            }
        }
        return false;
    });
}
exports.handleRecurring = functions.database.ref('/{user}/accounts/{account}/recurring/{key}').onWrite(handleRecurring);
exports.createUser = functions.auth.user().onCreate(setupUser);
exports.removeUser = functions.auth.user().onDelete(removeUserData);
//# sourceMappingURL=index.js.map