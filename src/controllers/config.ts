/**
 * Handles recurring transaction data interface
 */
import * as firebase from "firebase";

interface ConfigurationPeriod {
    length: string;
    start: string;
}

interface ConfigurationData {
    categories: Array<string>;
    periods: ConfigurationPeriod;
}

export default class Configuration {
    private ref : firebase.database.Reference;
    private data : ConfigurationData;

    // passed reference should be the current user root
    constructor(reference: firebase.database.Reference) {
        this.ref = reference;
    }

    async read() : Promise<ConfigurationData> {
        let snap = await this.ref.child('config').once('value');
        this.data = snap.val() as ConfigurationData;

        return this.data;
    }

    get categories() : string[] {
        return this.data.categories;
    }

    get start() : string {
        return this.data.periods.start;
    }

    get length() : string {
        return this.data.periods.length;
    }
}