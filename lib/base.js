var _ = require('underscore'),
    debug = require('debug')('couchdb:request');

module.exports = RequestBase;

function RequestBase(options) {
    this.options = options || {};
    if (this.options.request) {
        this.request = this.options.request;
    }

    this.options.requestDefaults = _.defaults(this.options.requestDefaults || {}, {
        method: 'GET',
        json: true
    });
}

['HEAD', 'GET', 'POST', 'DELETE', 'PUT', 'COPY'].forEach(function(method) {
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


RequestBase.prototype._request = function(url, options, callback) {
    var request = this.request || (this.request = require('request')).defaults(this.options.requestDefaults),
        opt = {
            url: url
        };

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


    if (opt.headers['Content-Type'] === 'multipart/related' && opt.method === 'GET') {
        opt.encoding = null;
    }


    debug(opt.method.toUpperCase() + ':' + opt.url);
    return request(opt, function(err, res, body) {
        // handle string if json option is off
        if (typeof body == 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                var contentType = res.headers && res.headers['content-type'];
                if (!contentType || contentType.indexOf('text/plain') == -1)
                    debug('JSON parse error:', e);
            }
        }

        if (err) return callback(err, body, res);

        if (res.statusCode < 400) {
            callback(err, body, res);
        } else {
            body = body || {};
            body.statusCode = res.statusCode;
            callback && callback(body, null, res);
        }
    });
};