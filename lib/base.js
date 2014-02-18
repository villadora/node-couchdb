var _ = require('underscore');

module.exports.RequestBase = RequestBase;
module.exports.encodeOptions = encodeOptions;

function RequestBase(options) {
    options = options || {};
    if (options.__request__) {
        this.__request__ = options.__request__;
    }
}

RequestBase.prototype._request = function(url, options, callback) {
    if (!this.__request__) {
        this.__request__ = require('request');
    }
    var opt = {
        url: url,
        method: 'GET',
        json: true
    };

    if (typeof options == 'function') {
        callback = options;
    } else if (typeof options === 'string') {
        opt.method = options;
    } else {
        _.extend(opt, options);
    }

    // if(callback)
    this.__request__(opt, function(err, res, body) {
        if (res.statusCode < 400) {
            callback(err, body, res);
        } else {
            callback(err || {
                statusCode: res.statusCode,
                responseBody: body,
                res: res
            });
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