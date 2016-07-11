// Date Math

function Timespan(value) {
    var m_time;
    
    if (typeof value == 'number') {
        m_time = { millis: value, months: 0, years: 0 };
    } else if (typeof value == 'string') {
        m_time = Timespan.parse(value);
    } else {
        throw "Invalid Timespan"
    }
    
    this.getTimeStruct = function() {
        return m_time;
    }
    
    this.getTime = function() {
        return m_time.millis + 
            m_time.months * 30.4375 * 24 * 3600 * 1000 + 
            m_time.years * 365.25 * 24 * 3600 * 1000;
    }
    
    this.getTotalMilliseconds = function() {
        return this.getTime();
    }
    
    this.getTotalSeconds = function() {
        return this.getTime() / 1000.0;
    }
    
    this.getTotalMinutes = function() {
        return this.getTotalSeconds() / 60.0;
    }
    
    this.getTotalHours = function() {
        return this.getTotalMinutes() / 60.0;
    }
    
    this.getTotalDays = function() {
        return this.getTotalHours() / 24.0;
    }
    
    this.getTotalWeeks = function() {
        return this.getTotalDays() / 7.0;
    }
    
    this.toString = function() {
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
}

Timespan.parse = function(value) {
    var re_phrase = /(\d+(?:\.\d+)?)\s*(year|yr|month|week|wk|day|dy|hour|hr|min|minute|second|sec)s?/gi;
    var re_time = /^(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)$/;
    
    if (re_time.test(value) == true) {
        var groups = re_time.exec(value);
        var hours = parseFloat(groups[1]);
        var minutes = parseFloat(groups[2]);
        var seconds = parseFloat(groups[3]);
        
        return seconds * 1000 + minutes * 60 * 1000 + hours * 3600 * 1000;
        
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
    
    return null;
}

Date.prototype.toFbString = function() {
    return this.getUTCFullYear() + "-" + (this.getUTCMonth() < 9 ? "0" + 
        (this.getUTCMonth() + 1) : this.getUTCMonth() + 1) + "-" + 
        (this.getUTCDate() < 10 ? "0" : "") + this.getUTCDate();
}

Date.today = function() {
    var d =  new Date(Date.now());
    
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

Date.parseFb = function(value) {
    var result = new Date(Date.parse(value));
    var offset = result.getTimezoneOffset() * 60000;
    
    return new Date(Date.parse(value) + offset);
}

Date.max = function(d1, d2) {
    if (Math.max(d1.getTime(), d2.getTime()) == d1.getTime()) {
        return d1;
    }
    return d2;
}

Date.min = function(d1, d2) {
    if (Math.min(d1.getTime(), d2.getTime()) == d1.getTime()) {
        return d1;
    }
    return d2;
}

Date.prototype.add = function(value) {
    value = value || new Timespan(0);
    
    if (Timespan.prototype.isPrototypeOf(value) == false) {
        value = new Timespan(value);
    }

    var result = new Date(value.getTimeStruct().millis + this.getTime());
    
    if (value.getTimeStruct().years != 0) {
        result.setUTCFullYear(result.getUTCFullYear() + value.getTimeStruct().years);
    }
    
    if (value.getTimeStruct().months != 0) {
        result.setUTCMonth(result.getUTCMonth() + value.getTimeStruct().months);
    }
    
    if (this.getTimezoneOffset() != result.getTimezoneOffset()) {
        // adjust for the timezone offset
        result = new Date(result.getTime() + 60000 * (result.getTimezoneOffset() - this.getTimezoneOffset()));
    }
    
    return result;
}

Date.prototype.subtract = function(value) {
    value = value || new Timespan(0);
    
    if (Date.prototype.isPrototypeOf(value) == true) {
        return new Timespan(this.getTime() - value.getTime());
    }
    
    if (Timespan.prototype.isPrototypeOf(value) == false) {
        value = new Timespan(value);
    }

    var result = new Date(this.getTime() - value.getTimeStruct().millis);
    
    if (value.getTimeStruct().years != 0) {
        result.setUTCFullYear(result.getUTCFullYear() - value.getTimeStruct().years);
    }
    
    if (value.getTimeStruct().months != 0) {
        result.setUTCMonth(result.getUTCMonth() - value.getTimeStruct().months);
    }
    
    return result;
}

Date.prototype.equals = function(other) {
    other = other || new Date();
    
    if (Date.prototype.isPrototypeOf(other) == false) {
        other = new Date(other);
    }
    
    return this.getTime() == other.getTime();
}

Date.prototype.lessThan = function(other) {
    other = other || new Date();
    
    if (Date.prototype.isPrototypeOf(other) == false) {
        other = new Date(other);
    }
    
    return this.getTime() < other.getTime();
}

Date.prototype.greaterThan = function(other) {
    other = other || new Date();
    
    if (Date.prototype.isPrototypeOf(other) == false) {
        other = new Date(other);
    }
    
    return this.getTime() > other.getTime();
}

Date.prototype.greaterThanEquals = function(other) {
    return this.equals(other) || this.greaterThan(other);
}

Date.prototype.lessThanEquals = function(other) {
    return this.equals(other) || this.lessThan(other);
}

Date.prototype.eq = Date.prototype.equals;
Date.prototype.lt = Date.prototype.lessThan;
Date.prototype.gt = Date.prototype.greaterThan;
Date.prototype.le = Date.prototype.lessThanEquals;
Date.prototype.ge = Date.prototype.greaterThanEquals;

Date.DAYSOFWEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
Date.ABBRDAYSOFWEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
Date.MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
Date.ABBRMONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


Date.prototype.format = function(fmt) {
    var result = "";
    
    while (fmt.length > 0) {
        if (fmt.startsWith("dddd") == true) {
            // full day of the week
            result += Date.DAYSOFWEEK[this.getUTCDay()];
            fmt = fmt.slice(4);
        } else if (fmt.startsWith("ddd") == true) {
            // abbreviated day of the week
            result += Date.ABBRDAYSOFWEEK[this.getUTCDay()];
            fmt = fmt.slice(3);
        } else if (fmt.startsWith("dd") == true) {
            // two digit day of the month
            result += (this.getUTCDate() < 10 ? "0" : "") + this.getUTCDate();
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("d") == true) {
            // day of the month
            result += this.getUTCDate();
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("hh") == true) {
            // two digit 12-hour clock
            var hour = this.getUTCHours() % 12;
            if (hour == 0) hour = 12;
            result += (hour < 10 ? "0" : "") + hour;
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("h") == true) {
            // 12-hour clock
            var hour = this.getUTCHours() % 12;
            if (hour == 0) hour = 12;
            result += hour;
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("HH") == true) {
            // two digit 24-hour clock
            var hour = this.getUTCHours();
            result += (hour < 10 ? "0" : "") + hour;
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("H") == true) {
            // 24-hour clock
            var hour = this.getUTCHours();
            result += hour;
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("K") == true) {
            // timezone information (0 = 'Z')
            var offset = this.getTimezoneOffset();
            var offsHours = Math.floor(Math.abs(offset) / 60);
            var offsMins = Math.round(Math.abs(offset) - offsHours * 60);
            if (offset == 0) {
                result += 'Z';
            } else {
                result += Math.sign(offset) == 1 ? '-' : '+';
                result += offsHours + ':' + (offsMins < 10 ? "0" : "") + offsMins;
            }
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("mm") == true) {
            // two digit minutes
            var min = this.getUTCMinutes();
            result += (min < 10 ? "0" : "") + min;
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("m") == true) {
            // minutes
            var min = this.getUTCMinutes();
            result += min;
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("MMMM") == true) {
            // full month name
            result += Date.MONTHS[this.getUTCMonth()];
            fmt = fmt.slice(4);
        } else if (fmt.startsWith("MMM") == true) {
            // abbreviated month name
            result += Date.ABBRMONTHS[this.getUTCMonth()];
            fmt = fmt.slice(3);
        } else if (fmt.startsWith("MM") == true) {
            // two digit month
            var month = this.getUTCMonth() + 1;
            result += (month < 10 ? "0" : "") + month;
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("M") == true) {
            // day of the month
            result += (this.getUTCMonth() + 1);
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("ss") == true) {
            // two digit minutes
            var sec = this.getUTCSeconds();
            result += (sec < 10 ? "0" : "") + sec;
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("s") == true) {
            // minutes
            var sec = this.getUTCSeconds();
            result += sec;
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("yyyyy") == true) {
            // at least 5 digit year
            var year = this.getUTCFullYear();
            result += (year < 100 ? "0" : "");
            result += (year < 1000 ? "0" : "");
            result += (year < 10000 ? "0" : "") + year;
            fmt = fmt.slice(5);
        } else if (fmt.startsWith("yyyy") == true) {
            // at least 4 digit year
            var year = this.getUTCFullYear();
            result += (year < 100 ? "0" : "");
            result += (year < 1000 ? "0" : "") + year;
            fmt = fmt.slice(4);
        } else if (fmt.startsWith("yyy") == true) {
            // at least 3 digit year
            var year = this.getUTCFullYear();
            result += (year < 100 ? "0" : "") + year;
            fmt = fmt.slice(3);
        } else if (fmt.startsWith("yy") == true) {
            // two digit year 0-99
            var year = this.getUTCFullYear() % 100;
            result += (year < 10 ? "0" : "") + year;
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("y") == true) {
            // year 0-99
            var year = this.getUTCFullYear() % 100;
            result += year;
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("zzz") == true) {
            // timezone offset in minutes and hours
            var offset = this.getTimezoneOffset();
            var offsHours = Math.floor(Math.abs(offset) / 60);
            var offsMins = Math.round(Math.abs(offset) - offsHours * 60);
            result += (Math.sign(offset) >= 1 ? '-' : '') +
                (offsHours < 10 ? "0" : "") + offsHours + ':' + 
                (offsMins < 10 ? "0" : "") + offsMins;
            fmt = fmt.slice(3);
        } else if (fmt.startsWith("zz") == true) {
            // hours offset from UTC with leading zeros
            var offset = this.getTimezoneOffset();
            var offsHours = -Math.floor(offset / 60);
            result += (Math.sign(offsHours) < 0 ? "-" : "") + 
                (Math.abs(offsHours) < 10 ? "0" : "") + Math.abs(offsHours);
            fmt = fmt.slice(2);
        } else if (fmt.startsWith("z") == true) {
            // hours offset from UTC with no leading zeros
            var offset = this.getTimezoneOffset();
            var offsHours = -Math.floor(offset / 60);
            result += offsHours;
            fmt = fmt.slice(1);
        } else if (fmt.startsWith("\\") == true) {
            // escape the next character
            result += fmt[1];
            fmt = fmt.slice(2);
        } else {
            result += fmt[0];
            fmt = fmt.slice(1);
        }
    }
    
    return result;
}
