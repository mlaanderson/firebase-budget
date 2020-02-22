type Constructor<T> = new(...args: any[]) => T;

function EventMaker<T extends Constructor<{}>>(Base: T) {
    return class Events extends Base {
        private listeners: {[event: string]: Array<(...args : any[]) => void>};

        constructor(...args: any[]) {
            super(...args);
            this.listeners = {};
        }

        on(event: string, handler: (...args : any[]) => void, context?: any) : Events {
            if (!this.listeners) this.listeners = {};

            if (event in this.listeners === false) {
                this.listeners[event] = [];
            }

            if (context) {
                handler.bind(context);
            }

            this.listeners[event].push(handler);

            return this;
        }

        off(event: string, handler?: (...args : any[]) => void) : Events {
            if (!this.listeners) return this;
            if (event in this.listeners === false) return this;

            if (handler) {
                let idx = this.listeners[event].indexOf(handler);
                if (idx >= 0) {
                    this.listeners[event].splice(idx, 1);
                }
            } else {
                this.listeners[event] = [];
            }

            return this;
        }

        once(event: string, handler: (...args : any[]) => void, context?: any) : Events {
            if (context) {
                handler.bind(context);
            }

            let tHandler = (...args : any[]) => {
                handler(...args);
                this.off(event, tHandler);
            }

            this.on(event, tHandler);

            return this;
        }

        emit(event: string, ...args : any[]) : Events {
            if (!this.listeners) return this;
            if (event in this.listeners === false) return this;
            let errors: Array<any> = new Array<any>();

            for (let handler of this.listeners[event]) {
                try {
                    handler(...args);
                } catch (error) {
                    errors.push(error);
                }
            }

            for (let error of errors) {
                throw(error);
            }

            return this;
        }

        emitAsync(event: string, ...args : any[]) : Promise<void> {
            if (!this.listeners) return Promise.resolve();
            let promises = new Array<Promise<void>>();

            if (event in this.listeners === false) return Promise.resolve();

            for (let handler of this.listeners[event]) {
                promises.push(new Promise((resolve, reject) => {
                    try {
                        handler(...args);
                    } catch (error) {
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

        static Extend<T extends Constructor<{}>>(Base: T) {
            return EventMaker(Base);
        }
    }
}

const Events = EventMaker(Object);

export default Events;