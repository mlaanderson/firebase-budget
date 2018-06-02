"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Events {
    constructor() {
        this.listeners = {};
    }
    on(event, handler, context) {
        if (event in this.listeners === false) {
            this.listeners[event] = [];
        }
        if (context) {
            handler.bind(context);
        }
        this.listeners[event].push(handler);
        return this;
    }
    off(event, handler) {
        if (event in this.listeners === false)
            return this;
        if (handler) {
            let idx = this.listeners[event].indexOf(handler);
            if (idx >= 0) {
                this.listeners[event].splice(idx, 1);
            }
        }
        else {
            this.listeners[event] = [];
        }
        return this;
    }
    once(event, handler, context) {
        if (context) {
            handler.bind(context);
        }
        let tHandler = (...args) => {
            handler(...args);
            this.off(event, tHandler);
        };
        this.on(event, tHandler);
        return this;
    }
    emit(event, ...args) {
        if (event in this.listeners === false)
            return this;
        let errors = new Array();
        for (let handler of this.listeners[event]) {
            try {
                handler(...args);
            }
            catch (error) {
                errors.push(error);
            }
        }
        for (let error of errors) {
            throw (error);
        }
        return this;
    }
    emitAsync(event, ...args) {
        let promises = new Array();
        if (event in this.listeners === false)
            return Promise.resolve();
        for (let handler of this.listeners[event]) {
            promises.push(new Promise((resolve, reject) => {
                try {
                    handler(...args);
                }
                catch (error) {
                    return reject(error);
                }
                resolve();
            }));
        }
        return new Promise((resolve, reject) => {
            Promise.all(promises).then(() => {
                resolve();
            }).catch((reason) => {
                reject(reason);
            });
        });
    }
}
exports.default = Events;
