"use strict";
/**
 * Generic data record controller
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase = require("firebase");
exports.firebase = firebase;
const events_1 = require("./events");
class Records extends events_1.default {
    constructor(reference) {
        super();
        this.ref = reference;
        this.ref.on('child_added', this.onChildAdded.bind(this));
        this.ref.on('child_changed', this.onChildChanged.bind(this));
        this.ref.on('child_removed', this.onChildRemoved.bind(this));
    }
    onChildAdded(snap, prevChild) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emitAsync('child_added', snap, prevChild);
        });
    }
    onChildChanged(snap, prevChild) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emitAsync('child_changed', snap, prevChild);
        });
    }
    onChildRemoved(snap, prevChild) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emitAsync('child_removed', snap, prevChild);
        });
    }
    sanitizeAfterRead(record) { return record; }
    sanitizeBeforeWrite(record) { return record; }
    loadRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            let snap = yield this.ref.once('value');
            let result = snap.val();
            for (let key in result) {
                result[key].id = key;
                result[key] = this.sanitizeAfterRead(result[key]);
            }
            return result;
        });
    }
    loadRecordsByChild(child, startAt, endAt) {
        return __awaiter(this, void 0, void 0, function* () {
            let cRef = this.ref.orderByChild(child);
            if (startAt) {
                cRef.startAt(startAt);
            }
            if (endAt) {
                cRef.endAt(endAt);
            }
            let snap = yield cRef.once('value');
            let data = snap.val();
            // Add in the id field and sanitize
            for (let key in data) {
                data[key].id = key;
                data[key] = this.sanitizeAfterRead(data[key]);
            }
            return data;
        });
    }
    save(record) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = record.id;
            delete record.id;
            // cleanse any undefined properties
            record = this.sanitizeBeforeWrite(record);
            if (id) {
                // update this record
                yield this.ref.child(id).set(record);
                return id;
            }
            else {
                // push the record
                let rec = yield this.ref.push(record);
                return rec.key;
            }
        });
    }
    load(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let snap = yield this.ref.child(key).once('value');
            let record = snap.val();
            record = this.sanitizeAfterRead(record);
            return record;
        });
    }
    remove(record) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof record !== "string") {
                record = record.id;
            }
            yield this.ref.child(record).remove();
            return record;
        });
    }
}
exports.Records = Records;
