/*global ejs, $ */
if (ejs) {
    ejs.renderFile = function () {
        "use strict";
        var args = Array.prototype.slice.call(arguments),
            path = args.shift(),
            cb = args.pop(),
            data = args.shift() || {},
            opts = args.pop() || {},
            renderTo = null;

        if (/\/|\.ejs$/.test(path) === false) {
            path = '/views/' + path + '.ejs';
        }

        if (typeof cb !== 'function') {
            // the call back is not a function
            // if it's a DOM element then append
            // the rendered view to the element
            if ($(cb).is('*') === true) {
                renderTo = $(cb);
                cb = function (viewData) {
                    renderTo.append($(viewData));
                };
            }
        }

        if (ejs.cache.get(path) !== undefined) {
            // load from the cache
            cb(ejs.render(ejs.cache.get(path), data, opts));
        } else {
            $.ajax({
                url: path,
                contentType: 'text/plain',
                success: function (templateString) {
                    ejs.cache.set(path, templateString);
                    cb(ejs.render(templateString, data, opts));
                }
            });
        }
    };
}

if (!('toProper' in String.prototype)) {
    String.prototype.toProper = function () {
        return this.substring(0,1).toUpperCase() + this.substring(1).toLowerCase();
    }
}
