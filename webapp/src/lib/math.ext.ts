

interface Math {
    roundTo: (value: number, digits: number) => number;
    sign: (value: number) => number;
}

Math.roundTo = function(value: number, digits: number) : number {
    var div = Math.pow(10, Math.round(digits));
    return Math.round(value * div) / div;
}

if ("sign" in Math === false) {
    Math.sign = function(value: number) : number {
        if (value < 0) return -1;
        if (value > 0) return 1;
        return 0;
    }
}
