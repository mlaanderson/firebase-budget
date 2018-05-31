class CashStruct {
    constructor() {
        this.hundreds = 0;
        this.fifties = 0;
        this.twenties = 0;
        this.tens = 0;
        this.fives = 0;
        this.ones = 0;
        this.cent25 = 0;
        this.cent10 = 0;
        this.cent5 = 0;
        this.cent1 = 0;
    }
    static default() {
        return new CashStruct();
    }
}
function toCurrency() {
    var result = Math.sign(this) < 0 ? "-$" : "$";
    var fixed = Math.abs(this).toFixed(2);
    if (fixed.indexOf('.') < 0) {
        fixed += '.00';
    }
    while ((fixed.length - fixed.indexOf('.')) < 3) {
        fixed += '0';
    }
    if (fixed.indexOf('.') > 3) {
        var idx = fixed.indexOf('.');
        // this needs commas
        fixed = fixed.slice(0, idx - 3) + ',' + fixed.slice(idx - 3);
        while ((idx = fixed.indexOf(',')) > 3) {
            fixed = fixed.slice(0, idx - 3) + ',' + fixed.slice(idx - 3);
        }
    }
    return result + fixed;
}
try {
    var number = 0;
    number.toLocaleString('i');
    Number.prototype.toCurrency = toCurrency;
}
catch (e) {
    if (e.name === 'RangeError') {
        Number.prototype.toCurrency = function () {
            return this.toLocaleString("en-US", { style: 'currency', currency: 'USD' });
        };
    }
    else {
        Number.prototype.toCurrency = toCurrency;
    }
}
Number.prototype.toCash = function () {
    var result = CashStruct.default();
    var val = Math.roundTo(this, 2);
    while (val >= 100) {
        val = Math.roundTo(val - 100, 2);
        result.hundreds++;
    }
    while (val >= 50) {
        val = Math.roundTo(val - 50, 2);
        result.fifties++;
    }
    while (val >= 20) {
        val = Math.roundTo(val - 20, 2);
        result.twenties++;
    }
    while (val >= 10) {
        val = Math.roundTo(val - 10, 2);
        result.tens++;
    }
    while (val >= 5) {
        val = Math.roundTo(val - 5, 2);
        result.fives++;
    }
    while (val >= 1) {
        val = Math.roundTo(val - 1, 2);
        result.ones++;
    }
    while (val >= 0.25) {
        val = Math.roundTo(val - 0.25, 2);
        result.cent25++;
    }
    while (val >= 0.1) {
        val = Math.roundTo(val - 0.1, 2);
        result.cent10++;
    }
    while (val >= 0.05) {
        val = Math.roundTo(val - 0.05, 2);
        result.cent5++;
    }
    while (val > 0) {
        val = Math.roundTo(val - 0.01, 2);
        result.cent1++;
    }
    return result;
};
