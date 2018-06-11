/**
 * Generic data record controller
 */

import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

import Events from "./events";
import { Record, RecordMap } from "../models/record";

class Records<T extends Record> extends Events {
    protected ref: firebase.database.Reference;

    constructor(reference: firebase.database.Reference) {
        super();
        this.ref = reference;

        this.ref.on('child_added', this.childAddedHandler.bind(this));
        this.ref.on('child_changed', this.childChangedHandler.bind(this));
        this.ref.on('child_removed', this.childRemovedHandler.bind(this));
    }

    private async childAddedHandler(snap: firebase.database.DataSnapshot, prevChild?: string) { 
        let record = this.sanitizeAfterRead(snap.val() as T);
        record.id = snap.key;
        this.onChildAdded(record);
    }

    private async childChangedHandler(snap: firebase.database.DataSnapshot, prevChild?: string) { 
        let record = this.sanitizeAfterRead(snap.val() as T);
        record.id = snap.key;
        this.onChildChanged(record);
    }

    private async childRemovedHandler(snap: firebase.database.DataSnapshot, prevChild?: string) { 
        let record = this.sanitizeAfterRead(snap.val() as T);
        record.id = snap.key;
        this.onChildRemoved(record);
    }

    /** This is only fired if THIS client saves the record */
    protected async onChildSaved(current: T, original: T) {
        this.emitAsync('child_saved', this.sanitizeAfterRead(current), this.sanitizeAfterRead(original), this);
    }

    protected async onChildAdded(record: T) {
        this.emitAsync('child_added', record, this);
    }

    protected async onChildChanged(record: T) {
        this.emitAsync('child_changed', record, this);
    }

    protected async onChildRemoved(record: T) {
        this.emitAsync('child_removed', record, this);
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
            cRef = cRef.startAt(startAt);
        }
        if (endAt) {
            cRef = cRef.endAt(endAt);
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

    async save(record: T, ...data: any[]) : Promise<string> {
        let id = record.id;
        delete record.id;

        // cleanse any undefined properties
        record = this.sanitizeBeforeWrite(record);

        if (id) {
            // fetch the existing record
            let original = await this.load(id);

            // update this record
            await this.ref.child(id).set(record);

            // emit a 'child_saved' event
            record.id = id;
            this.onChildSaved(record, original);

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

        if (record === null) return null;

        record.id = key;
        record = this.sanitizeAfterRead(record);

        return record;
    }

    async remove(record: T | string, ...data: any[]) : Promise<string> {
        if (typeof record !== "string") {
            record = record.id;
        }

        await this.ref.child(record).remove();
        return record;
    }
    
}

export { Records, firebase };