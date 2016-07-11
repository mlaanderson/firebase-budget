Math.roundTo = function (value, digits) {
    var div = Math.pow(10, Math.round(digits));
    return Math.round(value * div) / div;
}

Number.toLocaleStringSupportsLocales = function() {
  var number = 0;
  try {
    number.toLocaleString('i');
  } catch (e) {
    return e.name === 'RangeError';
  }
  return false;
}

if (Number.toLocaleStringSupportsLocales() == true) {
    Number.prototype.toCurrency = function() {
        return this.toLocaleString("en-US", { style: 'currency', currency: 'USD'});
    }
} else {
    Number.prototype.toCurrency = function() {
        var result = Math.sign(this) < 0 ? "-$" : "$";
        result += Math.abs(this.toFixed(2));
        
        if (result.indexOf('.') < 0) {
            result += '.00';
        }
        
        while ((result.length - result.indexOf('.')) < 3) {
            result += '0';
        }
        
        return result;
    }
}

Number.prototype.toCash = function() {
    var result = {
        hundreds: 0,
        fifties: 0,
        twenties: 0,
        tens: 0,
        fives: 0,
        ones: 0,
        cent25: 0,
        cent10: 0,
        cent5: 0,
        cent1: 0
    }
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
}