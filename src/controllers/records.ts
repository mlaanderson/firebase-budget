/**
 * Generic data record controller
 */

import * as firebase from "firebase";
import Events from "./events";

interface Record {
    id?: string;
}

interface RecordMap<T> {
    [key: string]: T;
}

class Records<T extends Record> extends Events {
    protected ref: firebase.database.Reference;

    constructor(reference: firebase.database.Reference) {
        super();
        this.ref = reference;

        this.ref.on('child_added', this.onChildAdded.bind(this));
        this.ref.on('child_changed', this.onChildChanged.bind(this));
        this.ref.on('child_removed', this.onChildRemoved.bind(this));
    }

    protected async onChildAdded(snap: firebase.database.DataSnapshot, prevChild?: string) { 
        this.emitAsync('child_added', snap, prevChild); 
    }

    protected async onChildChanged(snap: firebase.database.DataSnapshot, prevChild?: string) { 
        this.emitAsync('child_changed', snap, prevChild); 
    }

    protected async onChildRemoved(snap: firebase.database.DataSnapshot, prevChild?: string) { 
        this.emitAsync('child_removed', snap, prevChild); 
    }

    protected sanitizeAfterRead(record: T) : T { return record; }
    protected sanitizeBeforeWrite(record: T) : T { return record; }

    async loadRecords() : Promise<RecordMap<T>> {
        let snap = await this.ref.once('value');
        let result = snap.val() as RecordMap<T>;

        for (let key in result) {
            result[key].id = key;
            result[key] = this.sanitizeAfterRead(result[key]);
        }

        return result;
    }

    async loadRecordsByChild(child: string, startAt?: string | number | boolean, endAt?: string | number | boolean) : Promise<RecordMap<T>> {
        let cRef = this.ref.orderByChild(child);
        if (startAt) {
            cRef.startAt(startAt);
        }
        if (endAt) {
            cRef.endAt(endAt);
        }

        let snap = await cRef.once('value');
        let data = snap.val() as RecordMap<T>;

        // Add in the id field and sanitize
        for (let key in data) {
            data[key].id = key;
            data[key] = this.sanitizeAfterRead(data[key]);
        }

        return data;
    }

    async save(record: T) {
        let id = record.id;
        delete record.id;

        // cleanse any undefined properties
        record = this.sanitizeBeforeWrite(record);

        if (id) {
            // update this record
            await this.ref.child(id).set(record);
            return id;
        } else {
            // push the record
            let rec = await this.ref.push(record);
            return rec.key as string;
        }
    }

    async load(key: string) : Promise<T> {
        let snap = await this.ref.child(key).once('value');
        let record = snap.val() as T;

        record = this.sanitizeAfterRead(record);

        return record;
    }

    async remove(record: T | string) : Promise<string> {
        if (typeof record !== "string") {
            record = record.id;
        }

        await this.ref.child(record).remove();
        return record;
    }
    
}

export { Records, Record, RecordMap, firebase };