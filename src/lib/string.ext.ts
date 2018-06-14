interface String {
    padStart(targetLength: number, padString?: string) : string;
    padEnd(targetLength: number, padString?: string) : string;
}

if ("padStart" in String.prototype === false) {
    String.prototype.padStart = (targetLength: number, padString: string = " ") : string => {
        let result: string = this;
        while (result.length < targetLength) result = padString + result;
        return result;
    }
}
if ("padEnd" in String.prototype === false) {
    String.prototype.padEnd = (targetLength: number, padString: string = " ") : string => {
        let result: string = this;
        while (result.length < targetLength) result += padString;
        return result;
    }
}