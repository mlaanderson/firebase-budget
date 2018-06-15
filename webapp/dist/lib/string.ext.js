if ("padStart" in String.prototype === false) {
    String.prototype.padStart = (targetLength, padString = " ") => {
        let result = this;
        while (result.length < targetLength)
            result = padString + result;
        return result;
    };
}
if ("padEnd" in String.prototype === false) {
    String.prototype.padEnd = (targetLength, padString = " ") => {
        let result = this;
        while (result.length < targetLength)
            result += padString;
        return result;
    };
}
