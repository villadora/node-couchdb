var _ = require('underscore'),
    assert = require('assert'),
    util = require('util'),
    RequestBase = require('./base'),
    View = require('./view');

function DesignDoc(url, name, options) {
    RequestBase.call(this, options);
    this.url = url.replace(/\/$/, '');
    this.name = name;
}

util.inherits(DesignDoc, RequestBase);

_.extend(DesignDoc.prototype, {

    info: function(callback) {
        this._get(this.url + '/_info', function(err, body) {
            callback(err, body);
        });
    },
    /**
     * @name DdocGetOptions
     * @class
     * @property {string} rev
     * @property {boolean} revs
     * @property {boolean} revs_info
     */
    /**
     * @param {DdocGetOptions=} options
     */
    get: function(options, callback) {
        if (arguments.length == 1) {
            callback = options;
            options = undefined;
        }

        this._get(this.url + '?' + qs.stringify(options || {}), function(err, body) {
            callback(err, body);
        });
    },
    /**
     * @name DdocDelOptions
     * @class
     * @property {string} rev
     */
    /**
     * @param {DdocDelOptions=} options
     * @param {function} callback
     */
    del: function(options, callback) {
        if (arguments.length == 1) {
            callback = options;
            options = undefined;
        }

        this._delete(this.url + '?' + qs.stringify(options || {}), function(err, body) {
            callback(err, body);
        });
    },
    update: function(ddoc, callback) {
        this._put(this.url, {
            body: JSON.stringify(ddoc, function(key, val) {
                if (typeof val == 'function') {
                    return val.toString();
                }
                return val;
            })
        }, function(err, body) {
            callback(err, body);
        });
    },
    /**
     * @name DdocCopyOptions
     * @class
     * @property {string} from_rev
     * @property {string} to_rev
     */
    /**
     * @param {string} dest
     * @param {DdocCopyOptions=} options
     */
    copy: function(dest, options, callback) {
        if (arguments.length == 2 && typeof options == 'function') {
            callback = options;
            options = undefined;
        }

        options = options || {};

        this._copy(this.url + (options.from_rev ? ('?' + qs.stringify({
            rev: options.from_rev
        })) : ''), {
            headers: {
                Destination: dest + (options.to_rev ? ('?' + qs.stringify({
                    rev: options.to_rev
                })) : '')
            }
        }, function(err, rs) {
            callback(err, rs);
        });
    },
    view: function(viewname, options) {
        return new View(this.url + '/_view/' + viewname, viewname, options || this.options);
    },
    // ====================
    // Attachments
    // ====================
    // head attachment in 1.6 but not in 1.3.x
    getAttachment: function(attname, callback) {
        return this._get(this.url + '/' + encodeURIComponent(attname), function(err, body, res) {
            callback(err, body, res);
        });
    },
    attach: function(attname, type, data, rev, callback) {
        assert(!data || Buffer.isBuffer(data) || (typeof data == 'string'), 'data must be a Buffer of String instance');
        if (arguments.length === 4 && typeof rev == 'function') {
            callback = rev;
            rev = undefined;
        }

        var headers = {
            'Content-Type': type
        };

        data && (headers['Content-Length'] = data.length);

        return this._put(this.url + '/' + encodeURIComponent(attname) + (rev ? ('?' + qs.stringify({
            rev: rev
        })) : ''), {
            headers: headers,
            body: data
        }, function(err, body, res) {
            callback(err, body, res);
        });
    },
    delAttachment: function(attname, rev, callback) {
        this._delete(this.url + '/' + encodeURIComponent(attname) + '?' + qs.stringify({
            rev: rev
        }), function(err, body, res) {
            callback(err, body);
        });
    },
    attachment: function(name) {
        var self = this;
        return {
            attach: function(data, type, rev, callback) {
                self.attach(name, data, type, rev, callback);
            },
            get: function(callback) {
                self.getAttachment(name, callback);
            },
            update: function(data, type, rev, callback) {
                self.attach(name, data, type, rev, callback);
            },
            del: function(rev, callback) {
                self.delAttachment(name, rev, callback);
            }
        };
    }
    // ======================
    // TODO: shows & lists
    // ======================

});

module.exports = DesignDoc;