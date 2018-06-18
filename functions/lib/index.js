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
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
admin.initializeApp();
function today() {
    var d = new Date(Date.now());
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
function formatDate(date) {
    return date.getUTCFullYear() + "-" + (date.getUTCMonth() < 9 ? "0" +
        (date.getUTCMonth() + 1) : date.getUTCMonth() + 1) + "-" +
        (date.getUTCDate() < 10 ? "0" : "") + date.getUTCDate();
}
function setupUser(user, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let uid = user.uid;
        let userRef = admin.database().ref(uid);
        yield userRef.set({
            showWizard: true,
            name: 'Live',
            config: {
                categories: ['Income', 'Charity', 'Saving', 'Housing', 'Utilities', 'Food', 'Clothing', 'Transportation', 'Medical', 'Personal', 'Education', 'Recreation', 'Debt'],
                periods: {
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
    });
}
function removeUserData(user, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let uid = user.uid;
        admin.database().ref(uid).remove();
    });
}
exports.createUser = functions.auth.user().onCreate(setupUser);
exports.removeUser = functions.auth.user().onDelete(removeUserData);
//# sourceMappingURL=index.js.map