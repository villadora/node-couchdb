var _ = require('underscore'),
    assert = require('assert'),
    util = require('util'),
    RequestBase = require('./base'),
    encodeOptions = RequestBase.encodeOptions;


function DesignDoc(dburl, name, options) {
    RequestBase.call(this, options);
    this.dburl = dburl;
    this.url = this.dburl + '/_design/' + name;
    this.name = name;
}

util.inherits(DesignDoc, RequestBase);

_.extend(DesignDoc.prototype, {
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

        this._get(this.url + '?' + encodeOptions(options || {}), function(err, body) {
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

        this._delete(this.url + '?' + encodeOptions(options || {}), function(err, body) {
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

        this._copy(this.url + (options.from_rev ? ('?' + encodeOptions({
            rev: options.from_rev
        })) : ''), {
            headers: {
                Destination: dest + (options.to_rev ? ('?' + encodeOptions({
                    rev: options.to_rev
                })) : '')
            }
        }, function(err, rs) {
            callback(err, rs);
        });
    },
    view: function(viewname) {

    },
    // ====================
    // Attachments
    // ====================
    // TODO:
    getAttachment: function(callback) {
        this._get(this.url + '/attachment', function(err, body, res) {
            callback(err, body, res);
        });
    },
    setAttachment: function(type, buffer, rev, callback) {
        assert(Buffer.isBuffer(buffer) || (typeof buffer == 'string'), 'buffer must be a Buffer of String instance');
        if (arguments.length === 3 && typeof rev == 'function') {
            callback = rev;
            rev = undefined;
        }

        this._put(this.url + '/attachment' + (rev ? ('?' + encodeOptions({
            rev: rev
        })) : ''), {
            headers: {
                'Content-Type': type,
                'Content-Length': buffer.length
            },
            body: buffer
        }, function(err, body, res) {
            callback(err, body, res);
        });
    }
});

module.exports = RequestBase;