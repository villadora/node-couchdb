var _ = require('underscore');

module.exports.RequestBase = RequestBase;
module.exports.encodeOptions = encodeOptions;

function RequestBase(options) {
    options = options || {};
    if (options.request) {
        this.__request__ = options.request;
    }

    this.requestOpts = options.requestOpts || {};
}


['GET', 'POST', 'DEL', 'PUT'].forEach(function(m) {
    RequestBase.prototype['_' + m.toLowerCase()] = function(url, options, callback) {
        if (typeof options == 'function' && callback === undefined) {
            callback = options;
            options = null;
        }

        return this._request(url, options, callback);
    };
});


RequestBase.prototype._request = function(url, options, callback) {
    if (!this.__request__) {
        this.__request__ = require('request');
    }

    var opt = _.extend({
        json: true
    }, this.requestOpts);

    opt.method = 'GET';

    if (typeof options == 'function') {
        callback = options;
    } else if (typeof options === 'string') {
        opt.method = options;
    } else {
        _.extend(opt, options);
    }

    opt.url = url;

    // if(callback)
    this.__request__(opt, function(err, res, body) {
        if (err)
            return callback(err, body, res);

        if (typeof body == 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.warn(e, body);
            }
        }

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