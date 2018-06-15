import "./date.ext";
import "./number.ext";
import "./math.ext";

interface TimeStruct {
    millis: number;
    months: number;
    years: number;
}

class Timespan {
    private m_time : TimeStruct;

    constructor(value: number | string) {
        if (typeof value === 'number') {
            this.m_time = {
                millis: value,
                months: 0,
                years: 0
            };
        } else {
            this.m_time = Timespan.parse(value);
        }
    }

    getTimeStruct() : TimeStruct {
        return this.m_time;
    }

    getTime() : number {
        return this.m_time.millis + 
            this.m_time.months * 30.4375 * 24 * 3600 * 1000 +
            this.m_time.years * 365.25 * 24 * 3600 * 1000;
    }

    get Time() : number { return this.getTime(); }

    getTotalMilliseconds() : number {
        return this.getTime();
    }

    get TotalMilliseconds() : number {
        return this.getTime();
    }

    getTotalSeconds() : number {
        return this.getTime() / 1000.0;
    }

    get TotalSeconds() : number {
        return this.getTime() / 1000.0;
    }

    getTotalMinutes() : number {
        return this.getTotalSeconds() / 60.0;
    }

    get TotalMinutes() : number {
        return this.getTotalSeconds() / 60.0;
    }

    getTotalHours() : number {
        return this.getTotalMinutes() / 60.0;
    }

    get TotalHours() : number {
        return this.getTotalMinutes() / 60.0;
    }

    getTotalDays() : number {
        return this.getTotalHours() / 24.0;
    }

    get TotalDays() : number {
        return this.getTotalHours() / 24.0;
    }

    getTotalWeeks() : number {
        return this.getTotalDays() / 7.0;
    }

    get TotalWeeks() : number {
        return this.getTotalDays() / 7.0;
    }

    toString() : string {
        var result = "";
        
        var wks = Math.floor(this.getTotalWeeks());
        var time = Math.round((this.getTotalWeeks() - wks) * 7 * 24 * 3600 * 1000);
        
        if (wks != 0) {
            result = wks + " week" + (wks == 1 ? "" : "s");
        }
        
        var days = Math.floor(time / 24 / 3600 / 1000);
        time = Math.round(time - days * 24 * 3600 * 1000);
        
        if (days != 0) {
            result += (result == "" ? "" : " ") + days + " day" + (days == 1 ? "" : "s");
        }
        
        var hours = Math.floor(time / 3600 / 1000);
        time = Math.round(time - hours * 3600 * 1000);
        
        if (hours != 0) {
            result += (result == "" ? "" : " ") + hours + " hour" + (hours == 1 ? "" : "s");
        }
        
        var mins = Math.floor(time / 60 / 1000);
        time = Math.round(time - mins * 60 * 1000);
        
        if (mins != 0) {
            result += (result == "" ? "" : " ") + mins + " minute" + (mins == 1 ? "" : "s");
        }
        
        var seconds = Math.roundTo(time / 1000, 3);
    
        if (seconds != 0) {
            result += (result == "" ? "" : " ") + seconds + " second" + (seconds == 1 ? "" : "s");
        }       
        
        return result;
    }

    static parse(value : string) : TimeStruct {
        var re_phrase = /(\d+(?:\.\d+)?)\s*(year|yr|month|week|wk|day|dy|hour|hr|min|minute|second|sec)s?/gi;
        var re_time = /^(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)$/;
        
        if (re_time.test(value) == true) {
            var groups = re_time.exec(value);
            if (groups === null) return { millis: 0, months: 0, years: 0 };
            var hours = parseFloat(groups[1]);
            var minutes = parseFloat(groups[2]);
            var seconds = parseFloat(groups[3]);
            
            return {
                millis: seconds * 1000 + minutes * 60 * 1000 + hours * 3600 * 1000,
                months: 0,
                years: 0
            };
            
        } else {
            var parts = [];
            var part;
            var sum = 0, months = 0, years = 0;
            
            while ((part = re_phrase.exec(value)) != null) {
                parts.push({value: parseFloat(part[1]), unit: part[2].toLowerCase()});
            }
            
            if (parts.length == 0) {
                throw "Invalid date format";
            }
            
            for (var n = 0; n < parts.length; n++) {
                part = parts[n];
                
                switch(part.unit) {
                    case 'year':
                    case 'yr':
                        years += part.value;
                        break;
                    case 'month':
                        months += part.value;
                        break;
                    case 'week':
                    case 'wk':
                        sum += part.value * 7 * 24 * 3600 * 1000;
                        break;
                    case 'day':
                    case 'dy':
                        sum += part.value * 24 * 3600 * 1000;
                        break;
                    case 'hour':
                    case 'hr':
                        sum += part.value * 3600 * 1000;
                        break;
                    case 'minute':
                    case 'min':
                        sum += part.value * 60 * 1000;
                        break;
                    default:
                        sum += part.value * 1000;
                        break;
                }
            }
            
            return { millis: sum, months: months, years: years };
        }
    }
}

export default Timespan;