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

function __addChildListener(fo, child, key) {
    child.on("change", (function(data) {
        data.path.unshift(key);
        data.sender = this;
        this.emit("change", data);
    }).bind(fo));
}

function FirebaseObject(ref, asArray) {
    var _ref = ref;
    var _shadow = {};
    var _listeners = {};
    
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
    
    Object.defineProperty(this, "ref", {
        get: function() { return _ref; }
    });
    
    this.emit = function(event, data) {
        if (_listeners[event]) {
            // add a couple helper methods to data
            data.getPath = (function() {
                return this.path.join('/');
            }).bind(data);
            
            Object.defineProperty(data, "valueRef", {
                get: function() {
                    var obj = this.sender;
                    for (var n = 0; n < this.path.length - 1; n++) {
                        obj = obj[this.path[n]];
                    }
                    return obj.get(this.path[this.path.length - 1]);
                },
                set: function(val) {
                    var obj = this.sender;
                    for (var n = 0; n < this.path.length - 1; n++) {
                        obj = obj[this.path[n]];
                    }
                    obj.set(this.path[this.path.length - 1], val);
                },
                configurable: true,
                enumerable: true
            });
            
            for (var n = 0; n < _listeners[event].length; n++) {
                _listeners[event][n](data);
            }
        }
    }
    
    function _handleChange(snapshot) {
        var value = snapshot.val();
        
        for (var key in value) {
            var child;
            if ($.isPlainObject(value[key]) == true) {
                if (FirebaseObject.prototype.isPrototypeOf(_shadow[key]) == false) {
                    child = new FirebaseObject(_ref.child(key));
                    __addChildListener(this, child, key);
                } else {
                    // it is already defined as a FirebaseObject, it will update
                    // its own children.
                    child = _shadow[key];
                }
                _shadow[key] = child;
            } else if ($.isArray(value[key]) == true) {
                if (FirebaseObject.prototype.isPrototypeOf(_shadow[key]) == false) {
                    child = new FirebaseObject(_ref.child(key), true);
                    __addChildListener(this, child, key);
                } else {
                    // it is already defined as a FirebaseObject, it will update
                    // its own children.
                    child = _shadow[key];
                }
                _shadow[key] = child;
            } else {
                var oldVal = (key in _shadow) ? _shadow[key] : null;
                child = value[key];
                _shadow[key] = child;
                if ((true === key in _shadow) && (oldVal !== value[key])) {
                    // fire an on changed event with the key name
                    this.emit(key, { sender: this, path: [key], old: oldVal, current: value[key] });
                    
                    // on an on changed event with "change"
                    this.emit("change", { sender: this, path: [key], old: oldVal, current: value[key] });
                }
            }
            
            __defineFbProperty(this, key);
        }
    }
    
    function _handleChildRemoved(snap) {
        // delete the property reference
        var oldData = this[snap.key];
        
        this.emit("remove", {
            sender: this,
            path: [snap.key],
            old: oldData,
            current: null
        });
        delete this[snap.key];
    }
    
    function _handleAuth(authData) {
        if (authData != null) {
            _ref.on('value', _handleChange.bind(this));
            _ref.on('child_removed', _handleChildRemoved.bind(this));
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