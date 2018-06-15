export default class Cash {
    constructor() {
        this.hundreds =  0;
        this.fifties =  0;
        this.twenties =  0;
        this.tens =  0;
        this.fives =  0;
        this.ones =  0;
        this.cent25 =  0;
        this.cent10 =  0;
        this.cent5 =  0;
        this.cent1 = 0 ;
    }

    hundreds: number;
    fifties: number;
    twenties: number;
    tens: number;
    fives: number;
    ones: number;
    cent25: number;
    cent10: number;
    cent5: number;
    cent1: number;

    static default() : Cash {
        return new Cash();
    }

    add(other: Cash) {
        this.hundreds += other.hundreds;
        this.fifties += other.fifties;
        this.twenties += other.twenties;
        this.tens += other.tens;
        this.fives += other.fives;
        this.ones += other.ones;
        this.cent25 += other.cent25;
        this.cent10 += other.cent10;
        this.cent5 += other.cent5;
        this.cent1 += other.cent1;
    }

    getTotal() : number {
        return Math.roundTo(this.hundreds * 100.0 +
            this.fifties * 50.0 + 
            this.twenties * 20.0 +
            this.tens * 10.0 + 
            this.fives * 5.0 +
            this.ones +
            this.cent25 * 0.25 +
            this.cent10 * 0.1 + 
            this.cent5 * 0.05 + 
            this.cent1 * 0.01, 2);
    }
}