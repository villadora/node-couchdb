var _ = require('underscore'),
    assert = require('assert'),
    util = require('util'),
    qs = require('querystring'),
    RequestBase = require('./base');


function Document(dburl, doc, options) {
    if (!dburl)
        throw new Error('Database url should not be empty');

    RequestBase.call(this, options);
    this.dburl = dburl;


    if (typeof doc === 'string') {
        this._id = doc;
        doc = undefined;
    } else {
        this._id = doc._id;
    }
    this.doc = _.clone(doc);
}

util.inherits(Document, RequestBase);


_.extend(Document.prototype, {
    new: function(newDoc) {
        if (newDoc)
            this.doc = _.clone(newDoc);

        this._id = undefined;
        this._rev = undefined;
        return this;
    },
    id: function(id) {
        if (!id)
            return this._id;

        this._id = id;
        this.doc && (this.doc._id = id);
    },
    rev: function(rev) {
        if (!rev)
            return this._rev;
        this._rev = rev;
        this.doc && (this.doc._rev = rev);
    },
    update: function(newDoc) {
        this.set(newDoc);
        return this;
    },
    set: function(newDoc) {
        this.doc = _.clone(newDoc);
        this._id = (newDoc && newDoc._id) || this._id;
        this._rev = (newDoc && newDoc._rev) || this._rev;
        return this;
    },
    get: function() {
        return this.doc;
    },
    exists: function(callback) {
        this.head(function(err) {
            if (err && err.statusCode == 404) {
                return callback(undefined, false);
            } else if (!err) {
                return callback(undefined, true);
            }
            callback(err);
        });
    },
    /**
     * @name DocHeadOptions
     * @class
     * @property {string} rev
     * @property {boolean} revs
     * @property {boolean} revs_info
     */
    /**
     * @param {DocHeadOptions=} options
     * @param {function} callback
     */
    head: function(options, callback) {
        if (arguments.length == 1) {
            callback = options;
            options = {};
        }


        if (this._id === null || this._id === undefined)
            return callback(new Error("docid must be provided"));

        if (this._rev === null || this._rev === undefined)
            options = _.extend({
                rev: this._rev
            }, options);

        this._head(this.dburl + '/' + encodeURIComponent(this._id) + '?' + qs.stringify(options), function(err, body, res) {
            callback(err, res && res.headers, body);
        });

        return this;
    },
    /**
     * @name DocGetOptions
     * @class
     * @property {boolean} conflictss
     * @property {string} rev
     * @property {boolean} revs
     * @property {boolean} revs_info
     */
    /** 
     * @param {DocGetOptions=} options
     */
    open: function(options, callback) {
        var self = this;
        if (!callback && typeof options == 'function')
            callback = options, options = {};
        else if (typeof options == 'string') {
            options = {
                rev: options
            };
        }
        options = options || {};

        if (this._id === null || this._id === undefined)
            return (calback && callback(new Error("docid must be provided")));

        if (this._rev)
            options.rev = this._rev;

        var qstr = '';
        try {
            qstr = qs.stringify(options);
        } catch (e) {
            return (callback && callback(e));
        }

        var url = this.dburl + '/' + encodeURIComponent(this._id) + '?' + qstr;
        this._get(url, function(err, body) {
            if (!err && body) {
                self.set(body);
            }
            callback && callback(err, body);
        });
    },
    /**
     * get a list of revisions for this document
     */
    revisions: function(callback) {
        this.open({
            revs: true
        }, function(err, doc) {
            if (err) return (callback && callback(err));
            callback && callback(err, doc._revisions, doc);
        });
    },
    create: function(batch, callback) {
        var self = this;
        if (typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        self._post(this.dburl + (batch ? ("?" + qs.stringify({
            batch: 'ok'
        })) : ''), {
            body: JSON.stringify(this.doc)
        }, function(err, result) {
            if (err) return (callback && callback(err));
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

        self._put(this.dburl + '?' + qs.stringify(options), {
            body: JSON.stringify(self.doc)
        }, function(err, result) {
            if (err) return (callback && callback(err));
            self.rev(result.rev);
            callback && callback(err, result);
        });
    },
    destroy: function(rev, callback) {
        if (arguments.length == 1 && typeof rev == 'function') {
            callback = rev;
            rev = undefined;
        }

        rev = rev || this._rev;

        if (this._id === null || this._id === undefined)
            return (calback && callback(new Error("Docid must be provided")));

        if (rev === null || rev === undefined)
            return (calback && callback(new Error("Revision must be provided")));

        var self = this;
        self._delete(self.dburl + '/' + encodeURIComponent(self._id) + '?' + qs.stringify({
            rev: rev
        }), function(err, result) {
            console.log(result);
            if (self.doc)
                self.doc._deleted = true;
            self.deleted = true;
            callback && callback(err, result);
        });
    },
    /**
     * @name DocCopyOptions
     * @class
     * @property {string} from_rev
     * @property {string} to_rev
     */
    /**
     * @param {string} id
     * @param {DocCopyOptions=} options
     * @param {function} callback
     */
    copy: function(id, options, callback) {
        if (arguments.length == 2 && typeof options == 'function') {
            callback = options;
            options = undefined;
        }

        options = options || {};

        this._copy(this.dburl + '/' + encodeURIComponent(this._id) + ((options.from_rev || this._rev) ? ('?' + qs.stringify({
            rev: options.from_rev || this._rev
        })) : ''), {
            headers: {
                Destination: id + (options.to_rev ? ('?' + qs.stringify({
                    rev: options.to_rev
                })) : '')
            }
        }, function(err, rs) {
            callback(err, rs);
        });
    },
    // =========================
    // Attachment
    // =========================
    // TODO:
    attach: function(attname, data, type, callback) {
        var self = this;
        if (arguments.length == 2 && Array.isArray(rev) && typeof attname == 'function') {
            callback = attname;
            var atts = rev;
            callback('not implement yet');
        } else {

            if (this._id === null || this._id === undefined)
                return (calback && callback(new Error("Docid must be provided")));

            if (this._rev === null || this._rev === undefined)
                return (calback && callback(new Error("Revision must be provided")));

            var headers = {
                'Content-Type': type
            };

            data && (headers['Content-Length'] = data.length);

            assert(!data || Buffer.isBuffer(data) || (typeof data == 'string'), 'buffer must be a Buffer of String instance');
            return this._put([this.dburl, '/', encodeURIComponent(this._id), '/', encodeURIComponent(attname),
                    '?', this._rev ? qs.stringify({
                        rev: this._rev
                    }) : ''
                ].join(''), {
                    headers: headers,
                    body: data
                },
                function(err, body, res) {
                    body && body.rev && self.rev(body.rev);
                    callback && callback(err, body, res);
                });
        }
    },
    getAttachment: function(attname, callback) {
        return this._get(this.dburl + '/' + encodeURIComponent(this._id) + '/' + encodeURIComponent(attname), {
            headers: {
                'Content-Type': 'multipart/related'
            }
        }, function(err, buffer) {
            callback && callback(err, buffer);
        });
    },
    delAttachment: function(attname, callback) {
        var self = this,
            query = {};
        this._rev && (query.rev = this._rev);
        return this._delete(this.dburl + '/' + encodeURIComponent(this._id) + '/' + encodeURIComponent(attname) + '?' +
            qs.stringify(query), function(err, body) {
                if (!err && body && body.rev)
                    self.rev(body.rev);

                callback(err, body);
            });
    },
    attachment: function(name) {
        var self = this;
        return {
            attach: function(data, type, callback) {
                self.attach(name, data, type, callback);
            },
            get: function(callback) {

            },
            update: function(data, type, callback) {
                self.attach(name, data, type, callback);
            },
            del: function() {

            }
        };
    }
});


Document.prototype.delete = Document.prototype.del = Document.prototype.destroy;


module.exports = Document;