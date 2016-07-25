// firebase-objects.js

function __defineFbProperty(fo, key) {
    Object.defineProperty(fo, key.toString(), {
        get: function() {
            return fo.get(key);
        },
        set: function(val) {
            fo.set(key, val);
        },
        configurable: true,
        enumerable: true
    });
}

function FirebaseObject(ref, asArray) {
    var _ref = ref;
    var _shadow = {};
    var _listeners = {};
    var _setup = true;
    
    asArray = asArray || false;
    
    if (asArray == true) {
        // add the length property
        Object.defineProperty(this, 'length', {
            get: function() {
                if (Object.getOwnPropertyNames) {
                    return Object.getOwnPropertyNames(_shadow).length;
                }
                var n = 0;
                for (var k in _shadow) {
                    n++;
                }
                return n;
            }
        });
    }
    
    function emit(event, data) {
        if (_listeners[event]) {
            for (var n = 0; n < _listeners[event].length; n++) {
                _listeners[event][n](data);
            }
        }
    }
    
    function _handleChange(snapshot) {
        var value = snapshot.val();
        
        _shadow = {};
        
        for (var key in value) {
            var child;
            if ($.isPlainObject(value[key]) == true) {
                if (FirebaseObject.prototype.isPrototypeOf(_shadow[key]) == false) {
                    child = new FirebaseObject(_ref.child(key));
                } else {
                    // it is already defined as a FirebaseObject, it will update
                    // its own children.
                    child = _shadow[key];
                }
            } else if ($.isArray(value[key]) == true) {
                if (FirebaseObject.prototype.isPrototypeOf(_shadow[key]) == false) {
                    child = new FirebaseObject(_ref.child(key), true);
                } else {
                    // it is already defined as a FirebaseObject, it will update
                    // its own children.
                    child = _shadow[key];
                }
            } else {
                if ((_setup == false) && (_shadow[key] !== value[key])) {
                    // fire an on changed event
                    emit(key, { sender: this, old: _shadow[key], current: value[key] });
                }
                child = value[key];
            }
            _shadow[key] = child;
            
            __defineFbProperty(this, key);
        }
        _setup = false;
    }
    
    function _handleAuth(authData) {
        if (authData != null) {
            _ref.on('value', _handleChange.bind(this));
        }
    }
    
    this.get = function(key) {
        return _shadow[key];
    }
    
    this.set = function(key, val) {
        var obj = {};
        obj[key] = val;
        _ref.update(obj);
    }
    
    this.add = this.set;
    this.push = this.set;
    
    this.remove = function(key) {
        this.set(key, null);
    }
    
    this.on = function(event, handler) {
        if (_listeners[event] === undefined) {
            _listeners[event] = [];
        }
        _listeners[event].push(handler);
    }
    
    if (_ref.onAuth) { // Firebase 2.x
        _ref.onAuth(_handleAuth.bind(this));
    } else { // Firebase 3.x
        _ref.database.app.auth().onAuthStateChanged(_handleAuth.bind(this));
    }
}