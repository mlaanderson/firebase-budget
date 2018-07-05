Math.roundTo = function (value, digits) {
    var div = Math.pow(10, Math.round(digits));
    return Math.round(value * div) / div;
};
if ("sign" in Math === false) {
    Math.sign = function (value) {
        if (value < 0)
            return -1;
        if (value > 0)
            return 1;
        return 0;
    };
}
//# sourceMappingURL=math.ext.js.map