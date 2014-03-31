var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base'),
    encodeOptions = RequestBase.encodeOptions;


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
    this.doc = doc;
}

util.inherits(Document, RequestBase);


_.extend(Document.prototype, {
    newDoc: function(newDoc) {
        if (newDoc)
            this.doc = newDoc;

        this._id = undefined;
        return this;
    },
    updateDoc: function(newDoc) {
        this.setDoc(newDoc);
    },
    setDoc: function(newDoc) {
        this.doc = newDoc;
        this._id = (newDoc && newDoc._id) || this._id;
        return this;
    },
    getDoc: function() {
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

        this._head(this.dburl + '/' + encodeURIComponent(this._id) + '?' + encodeOptions(options), function(err, body, res) {
            callback(err, res && res.headers, body);
        });

        return this;
    },
    /**
     * @name DocGetOptions
     * @class
     * @property {boolean} conflicts
     * @property {string} rev
     * @property {boolean} revs
     * @property {boolean} revs_info
     */
    /** 
     * @param {DocGetOptions=} options
     */
    open: function(options, callback) {
        if (!callback && typeof options == 'function')
            callback = options, options = {};

        if (this._id === null || this._id === undefined)
            return callback(new Error("docid must be provided"));

        var url = this.dburl + '/' + encodeURIComponent(this._id) + '?' + encodeOptions(options || {});

        this._get(url, function(err, body) {
            if (!err && body)
                this.doc = body;
            callback(err, body);
        });
    },
    /**
     * get a list of revisions for this document
     */
    revisions: function(callback) {
        this.open({
            revs: true
        }, function(err, doc, body) {
            if (err) return callback(err);
            callback(err, body._revisions, body);
        });
    },
    create: function(batch, callback) {
        var self = this;
        if (typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        self._post(this.dburl + (batch ? ("?" + encodeOptions({
            batch: 'ok'
        })) : ''), {
            body: JSON.stringify(this.doc)
        }, function(err, result) {
            if (err) return callback(err);
            self.doc._rev = result.rev;
            delete this.deleted;
            callback(null, result);
        });
    },
    save: function(batch, callback) {
        var self = this;
        if (arguments.length == 1 && typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        self._put(this.dburl, +(batch ? ('?' + encodeOptions({
            batch: 'ok'
        })) : ''), {
            body: JSON.stringify(self.doc)
        }, function(err, result) {
            if (err) return callback(err);
            self.doc._rev = result.rev;
            callback(err, result);
        });
    },
    destroy: function(rev, callback) {
        var self = this;
        self._delete(self.dburl + '/' + encodeURIComponent(self._id) + '?' + encodeOptions({
            rev: rev
        }), function(err, result) {
            if (self.doc)
                self.doc._deleted = true;
            self.deleted = true;
            callback(err, result);
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
        this._copy(this.dburl + '/' + this._id + (options.from_rev ? ('?' + encodeOptions({
            rev: options.from_rev
        })) : ''), {
            headers: {
                Destination: id + (options.to_rev ? ('?' + encodeOptions({
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
    attach: function() {

    },
    attachment: function() {
        var self = this;
        return {
            attach: function() {

            },
            get: function() {

            },
            update: function() {

            },
            del: function() {

            }
        };
    }
});


Document.prototype.delete = Document.prototype.del = Document.prototype.destroy;


module.exports = Document;