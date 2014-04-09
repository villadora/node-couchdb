var _ = require('underscore'),
    assert = require('assert'),
    qs = require('querystring'),
    util = require('util'),
    Document = require('./doc'),
    View = require('./view');

function DesignDoc(dburl, name, options) {
    Document.call(this, dburl, '_design/' + name, options);
    this.designName = name;

}

util.inherits(DesignDoc, Document);

_.extend(DesignDoc.prototype, {
    _encodeId: function() {
        return this._id;
    },
    info: function(callback) {
        this._get(this.dburl + '/' + this._id + '/_info', function(err, body) {
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

        this._delete(this.dburl + '?' + qs.stringify(options || {}), function(err, body) {
            callback(err, body);
        });
    },
    create: function(batch, callback) {
        var self = this;
        if (typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        self._put(this.dburl + '/' + this._id + (batch ? ("?" + qs.stringify({
            batch: 'ok'
        })) : ''), {
            body: JSON.stringify(this.doc, fnTrans)
        }, function(err, result) {
            if (err) return (callback && callback(err));
            self.id(result.id);
            self.rev(result.rev);
            delete this.deleted;
            callback && callback(null, result);
        });
    },
    save: function(batch, callback) {
        var self = this;
        if (arguments.length == 1 && typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        var options = {};
        batch && (options.batch = 'ok');
        this._rev && (options.rev = this._rev);

        self._put(this.dburl + '/' + this._id + '?' + qs.stringify(options), {
            body: JSON.stringify(self.doc, fnTrans)
        }, function(err, result) {
            if (err) return (callback && callback(err));
            self.rev(result.rev);
            callback && callback(err, result);
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
    addAttachment: function(attname, type, data, rev, callback) {
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
            attach: function() {
                var args = Array.prototype.unshift.call(arguments, name);
                self.addAttachment.apply(self, args);
            },
            get: function(callback) {
                self.getAttachment(name, callback);
            },
            update: function() {
                var args = Array.prototype.unshift.call(arguments, name);
                self.addAttachment.apply(self, args);
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



function fnTrans(key, value) {
    if (typeof value == 'function')
        return '(' + value.toString() + ')';
    return value;
}