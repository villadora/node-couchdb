var _ = require('underscore');
var debug = require('debug')('couchdb:general');
var dbody = require('debug')('couchdb:body');
var dreq = require('debug')('couchdb:request');


require('buffer');


module.exports = RequestBase;

function RequestBase(options) {
    this.options = options || {};
    if (this.options.request) {
        this.request = this.options.request;
    }

    this.options.requestDefaults = _.defaults(this.options.requestDefaults || {}, {
        method: 'GET'
    });
    this.enableJson = true;
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
    var request = this.request || (this.request = require('request').defaults(this.options.requestDefaults)),
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


    /* jshint sub: true */
    if (opt.headers['Accept'] || opt.headers['accept'] || this.enableJson)
        opt.headers["Accept"] = opt.headers["Accept"] || opt.headers["accept"] || "application/json";

    if (opt.headers['Content-Type'] || opt.headers['content-type'] || this.enableJson) {
        opt.headers["Content-Type"] = opt.headers["Content-Type"] || opt.headers["content-type"] || "application/json";
    }

    // prevent bugs where people set encoding when piping                                                                                                     
    if (opt.encoding !== undefined && callback) {
        opt.encoding = opt.encoding;
        delete opt.headers['Content-Type'];
        delete opt.headers['Accept'];
    }

    if (opt.headers['Content-Type'] === 'multipart/related' && opt.method === 'GET') {
        opt.encoding = null;
    }

    dreq(JSON.stringify(opt));

    debug(opt.method.toUpperCase() + ':' + opt.url);
    return request(opt, function(err, res, body) {
        if (Buffer.isBuffer(body))
            body = body.toString();

        dbody(typeof body == 'string' ? body : JSON.stringify(body));

        // handle string if json option is off
        if (typeof body == 'string' && (!res.headers['content-type'] || /json/.test(res.headers['content-type']))) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                var contentType = res.headers && res.headers['content-type'];
                if (!contentType || contentType.indexOf('text/plain') == -1)
                    debug('JSON parse error:', e);
            }
        }

        if (err) return (callback && callback(err, body, res));

        if (res.statusCode < 400) {
            callback && callback(err, body, res);
        } else {
            body = body || {};
            body.statusCode = res.statusCode;
            callback && callback(body, null, res);
        }
    });
};