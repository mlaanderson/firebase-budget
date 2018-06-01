export default class CashStruct {
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

    static default() : CashStruct {
        return new CashStruct();
    }

    add(other: CashStruct) {
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
}