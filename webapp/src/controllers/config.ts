/**
 * Handles recurring transaction data interface
 */
import * as firebase from "firebase";

export type Themes = "default" | "purple" | "brown"

interface ConfigurationPeriod {
    length: string;
    start: string;
}

export interface ConfigurationData {
    showWizard?: boolean;
    categories: Array<string>;
    periods: ConfigurationPeriod;
    theme: Themes
}

export default class Configuration {
    private ref : firebase.database.Reference;
    private data : ConfigurationData = {
        categories: [ "Income",
        "Charity",
        "Saving",
        "Housing",
        "Utilities",
        "Food",
        "Clothing",
        "Transportation",
        "Medical",
        "Insurance",
        "Personal",
        "Recreation",
        "Debt"],
        periods: {
            length: "2 weeks",
            start: "2016-06-24"
        },
        "theme": "default"
    };

    // passed reference should be the current user root
    constructor(reference: firebase.database.Reference) {
        this.ref = reference;
    }

    async read() : Promise<ConfigurationData> {
        let snap = await this.ref.child('config').once('value');

        if (snap.val()) {
            this.data = snap.val() as ConfigurationData;
        }
        return this.data;
    }

    async write() : Promise<void> {
        await this.ref.child('config').set(this.data);
    }

    get categories() : string[] {
        return this.data.categories;
    }

    set categories(value: string[]) {
        this.data.categories = value;
    }

    get start() : string {
        return this.data.periods.start;
    }

    set start(value: string) {
        this.data.periods.start = value;
    }

    get length() : string {
        return this.data.periods.length;
    }

    set length(value: string) {
        this.data.periods.length = value;
    }

    get theme() : Themes {
        return this.data.theme || "default";
    }

    set theme(value: Themes)  {
        this.data.theme = value;
    }

    calculatePeriod(date: string | Date) : { start: string, end: string } {
        if (typeof date === "string") {
            date = Date.parseFb(date);
        }

        let start = date.periodCalc(this.start, this.length);
        let end = start.add(this.length).subtract('1 day') as Date;

        return {
            start: start.toFbString(),
            end: end.toFbString()
        };
    }

    toJSON() : ConfigurationData {
        return this.data;
    }
}