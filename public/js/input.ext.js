HTMLInputElement.supportsType = function(t) {
    t = t.toLowerCase(); 
    try { 
        var inp = document.createElement("input"); 
        inp.type = t;
        if (inp.type == t) { return true; }
    } catch (e) {
    } 
    return false; 
};