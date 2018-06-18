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
const firebase = require("firebase/app");
require("firebase/auth");
const events_1 = require("./events");
class HistoryManager extends events_1.default {
    constructor(transactions, recurring) {
        super();
        this.pointer = 0;
        var items = new Array();
        var pointer = 0;
        if (window.localStorage && localStorage.getItem('budget.history') !== null) {
            let stored = JSON.parse(localStorage.getItem('budget.history'))[firebase.auth().currentUser.uid];
            if (stored) {
                items.push(...stored.items);
                pointer = stored.pointer;
            }
        }
        this.pointer = pointer;
        this.items = new Array(...items);
        this.transactions = transactions;
        this.recurring = recurring;
        setImmediate(() => this.emitAsync('change'));
    }
    storeHistory() {
        if (window.localStorage) {
            let data = JSON.parse(window.localStorage.getItem('budget.history') || "{}");
            data[firebase.auth().currentUser.uid] = this.toJSON();
            window.localStorage.setItem('budget.history', JSON.stringify(data));
        }
    }
    push(item) {
        // remove all the items after the pointer,
        // we've branched the undo process and cannot 
        // guarantee redos would not break things
        this.items.splice(this.pointer);
        // update the pointer
        this.pointer++;
        let n = this.items.push(item);
        // limit the history size so localstorage doesn't get overwhelmed
        while (this.items.length > 100) {
            this.items.shift();
            this.pointer--;
        }
        this.storeHistory();
        this.emitAsync('change');
        return n;
    }
    get canUndo() {
        return this.pointer > 0;
    }
    get canRedo() {
        return this.pointer < this.items.length;
    }
    revertChange(change) {
        return __awaiter(this, void 0, void 0, function* () {
            if (change.initial) {
                switch (change.type) {
                    case 'Recurring':
                        yield this.recurring.save(change.initial);
                        break;
                    case 'Transaction':
                        yield this.transactions.save(change.initial);
                        break;
                }
            }
        });
    }
    redoChange(change) {
        return __awaiter(this, void 0, void 0, function* () {
            if (change.initial) {
                switch (change.type) {
                    case 'Recurring':
                        yield this.recurring.save(change.final);
                        break;
                    case 'Transaction':
                        yield this.transactions.save(change.final);
                        break;
                }
            }
        });
    }
    revertCreate(change) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (change.type) {
                case 'Recurring':
                    yield this.recurring.remove(change.final);
                    break;
                case 'Transaction':
                    yield this.transactions.remove(change.final);
                    break;
            }
        });
    }
    redoCreate(change) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (change.type) {
                case 'Recurring':
                    yield this.recurring.save(change.final);
                    break;
                case 'Transaction':
                    yield this.transactions.save(change.final);
                    break;
            }
        });
    }
    revertDelete(change) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (change.type) {
                case 'Recurring':
                    yield this.recurring.save(change.final);
                    break;
                case 'Transaction':
                    yield this.transactions.save(change.final);
                    break;
            }
        });
    }
    redoDelete(change) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (change.type) {
                case 'Recurring':
                    yield this.recurring.remove(change.final);
                    break;
                case 'Transaction':
                    yield this.transactions.remove(change.final);
                    break;
            }
        });
    }
    undo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.canUndo)
                return;
            this.pointer--;
            let changes = this.items[this.pointer];
            for (let change of changes.items) {
                switch (change.action) {
                    case 'change':
                        yield this.revertChange(change);
                        break;
                    case 'create':
                        yield this.revertCreate(change);
                        break;
                    case 'delete':
                        yield this.revertDelete(change);
                        break;
                }
            }
            this.emitAsync('change');
            this.storeHistory();
        });
    }
    redo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.canRedo)
                return;
            let changes = this.items[this.pointer];
            for (let change of changes.items) {
                switch (change.action) {
                    case 'change':
                        yield this.redoChange(change);
                        break;
                    case 'create':
                        yield this.redoCreate(change);
                        break;
                    case 'delete':
                        yield this.redoDelete(change);
                        break;
                }
            }
            this.pointer++;
            this.emitAsync('change');
            this.storeHistory();
        });
    }
    clear() {
        this.items = [];
        this.pointer = 0;
        this.emitAsync('change');
        this.storeHistory();
    }
    toJSON() {
        return {
            pointer: this.pointer,
            items: this.items
        };
    }
}
exports.default = HistoryManager;
