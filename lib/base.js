var _ = require('underscore'),
    debug = require('debug')('couchdb:request');

module.exports = RequestBase;
module.exports.encodeOptions = encodeOptions;

function RequestBase(options) {
    this.options = options || {};
    if (this.options.__request__) {
        this.__request__ = this.options.__request__;
    }

    this.requestOpts = this.options.requestOpts || {
        method: 'GET',
        json: true
    };
}

['GET', 'POST', 'DEL', 'PUT'].forEach(function(method) {
    RequestBase.prototype['_' + method.toLowerCase()] = function(url, options, callback) {
        if (typeof options == 'function') {
            callback = options;
            options = {};
        } else if (typeof options === 'string') {
            options = {};
        }

        options.method = method;
        return this._request(url, options, callback);
    };
});

RequestBase.prototype._copy = function(url, options, callback) {

};

RequestBase.prototype._request = function(url, options, callback) {
    if (!this.__request__) {
        this.__request__ = require('request');
    }

    var opt = _.extend({
        url: url
    }, this.requestOpts);

    if (this.options.auth) {
        opt.auth = {
            user: this.options.auth.user,
            pass: this.options.auth.pass,
            sendImmediately: true
        };
    }


    if (typeof options == 'function') {
        callback = options;
    } else if (typeof options === 'string') {
        opt.method = options;
    } else {
        _.extend(opt, options);
    }

    // set headers
    opt.headers = (opt.headers && typeof(opt.headers) == 'object') ? opt.headers : {};
    opt.headers["Content-Type"] = opt.headers["Content-Type"] || opt.headers["content-type"] || "application/json";

    /* jshint sub: true */
    opt.headers["Accept"] = opt.headers["Accept"] || opt.headers["accept"] || "application/json";

    debug(opt.method.toUpperCase() + ':' + opt.url);

    this.__request__(opt, function(err, res, body) {
        // handle string if json option is off
        if (typeof body == 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                var contentType = res.headers && res.headers['content-type'];
                if (!contentType || contentType.indexOf('text/plain') == -1)
                    console.warn('JSON parse error:', e);
            }
        }

        if (err) return callback(err, body, res);

        if (res.statusCode < 400) {
            callback(err, body, res);
        } else {
            body.statusCode = res.statusCode;
            callback(body, null, res);
        }
    });
};


function encodeOptions(options) {
    var buf = [];
    if (typeof(options) == "object" && options !== null) {
        for (var name in options) {
            if (!options.hasOwnProperty(name)) continue;
            var value = options[name];
            if (name == "key" || name == "startkey" || name == "endkey" || name == "start_key" || name == "end_key") {
                value = (value === null) ? null : JSON.stringify(value);
            }
            buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
        }
    }

    if (!buf.length) return "";

    return buf.join("&");
}