var _ = require('underscore'),
    async = require('async'),
    util = require('util'),
    url_module = require('url'),
    RequestBase = require('./base'),
    encodeOptions = RequestBase.encodeOptions;

module.exports = Database;

function Database(url, dbname, options) {
    options = options || {};

    RequestBase.call(this, options);
    this.url = url;
    this.dbname = dbname;
    this.dbUrl = url_module.resolve(url, dbname);
}

util.inherits(Database, RequestBase);

_.extend(Database.prototype, {
    /*
     * Extend Database object
     * @param {Object} extend
     */
    bind: function(extend) {
        for (var key in extend) {
            var val = extend[key];
            if (typeof val == 'function') {
                this[key] = val.bind(this);
            } else
                this[key] = val;
        }
        return this;
    },
    newUuids: function() {
        throw new Error('No newUuids method in Database');
    },
    /**
     * @couchdb 1.5
     */
    exists: function(callback) {
        this._head(this.dbUrl, function(err, body, res) {
            if (err && err.statusCode == 404)
                return callback(null, false);

            callback(err, !err);
        });
    },
    info: function(callback) {
        this._get(this.dbUrl, function(err, info) {
            callback(err, info);
        });
    },
    create: function(callback) {
        this._put(this.dbUrl, function(err, body) {
            if (body && body.error) {
                callback(err || body.reason);
            } else
                callback(err, body);
        });
    },
    destroy: function(callback) {
        this._delete(this.dbUrl, callback);
    },
    purge: function(docs, callback) {
        // TODO: format docs obj

        this._post(this.dbUrl + '/_purge', {
            body: JSON.stringify(docs || {})
        }, function(err, body) {
            console.log(err, body);
            callback(err, body);
        });
    },
    compact: function(callback) {
        this._post(this.dbUrl + '/_compact', callback);
    },
    compactDdoc: function(ddoc, callback) {
        this._post(this.dbUrl + '/_compact/' + ddoc, callback);
    },
    ensureCommit: function(callback) {
        this._post(this.dbUrl + '/_ensure_full_commit', callback);
    },
    viewCleanup: function(callback) {
        this._post(this.dbUrl + '/_view_cleanup', callback);
    },
    /**
     * @param {number} skip
     * @param {number} limit
     * @param {AllDocsOptions=} options
     * @param {function} callback
     */
    allDocs: function(skip, limit, options, callback) {
        if (arguments.length == 1) {
            callback = skip;
            skip = limit = undefined;
        } else if (arguments.length == 3 && typeof options == 'function') {
            callback = options;
            options = undefined;
        }

        var query = {};
        (typeof skip == 'number') && (query.skip = skip);
        (typeof limit == 'number') && (query.limit = limit);

        this._get(this.dbUrl + '/_all_docs?' + encodeOptions(_.extend(query, options)), function(err, body) {
            if (err) return callback(err);
            callback(err, body.rows, body.total_rows, body.offset, body.update_seq);
        });
    },
    /**
     * @name AllDocsOptions
     * @class
     * @property {boolean} inclusive_end
     * @property {boolean} include_docs whether include the full doc, default is false
     * @property {boolean} descending
     * @property {boolean} group
     * @property {number} group_level
     * @property {boolean} reduce
     * @property {number} skip
     * @property {number} limit
     */
    /*
     * @param {string} startkey
     * @param {string} endkey
     * @param {AllDocsOptions=} options
     * @param {function} callback
     */
    searchByKeys: function(startkey, endkey, options, callback) {
        var key;
        if (arguments.length == 2 && typeof endkey == 'function') {
            callback = endkey;
            key = startkey;
            endkey = startkey = undefined;
        } else if (arguments.length == 3 && typeof options == 'function') {
            callback = options;
            options = undefined;
        }

        var url = this.dbUrl + '/_all_docs?' + (key ?
            encodeOptions(_.extend({
                'key': key
            }, options)) : encodeOptions(_.extend({
                'startkey': startkey || null,
                'endkey': endkey || null
            }, options)));

        this._get(url, function(err, body) {
            if (err) return callback(err);

            callback(err, body.rows, body.total_rows, body.offset, body.update_seq);
        });
    },
    /**
     * @param {string} startid
     * @param {string} endId
     * @param {AllDocsOptions=} options
     * @param {function} callback
     */
    searchByIds: function(startId, endId, options, callback) {
        if (arguments.length == 3 && typeof options == 'function') {
            callback = options;
            options = undefined;
        }

        var url = this.dbUrl + '/_all_docs?' + encodeOptions(_.extend({
            'startkey_docid': startId || null,
            'endkey_docid': endId || null
        }, options));

        this._get(url, function(err, body) {
            if (err) return callback(err);

            callback(err, body.rows, body.total_rows, body.offset, body.update_seq);
        });
    },
    select: function(filter, callback) {

    },
    mget: function(keys, callback) {
        this._post(this.dbUrl + '/_all_docs', {
            body: JSON.stringify({
                keys: keys
            })
        }, function(err, data) {
            if (err) return callback(err);

            callback(err, body.rows, body.total_rows, body.offset, body.update_seq);
        });
    },

    allDocsBySeq: function(options, keys, callback) {
        if (!keys) {
            this._request(this.uri + "/_all_docs_by_seq" + encodeOptions(options), 'GET', function(err, docs) {
                callback(err, docs);
            });
        } else {
            this._request(this.uri + "/_all_docs_by_seq" + encodeOptions(options), {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keys: keys
                })
            }, function(err, docs) {
                callback(err, docs);
            });
        }
    },
    save: function(doc, batch, callback) {
        async.waterfall([

            function(cb) {
                if (doc._id === undefined) {
                    this.newUuids(1, function(err, uuids) {
                        if (err) return cb(err);

                        doc._id = uuids[0];
                        cb();
                    });
                } else
                    cb();
            },
            function(cb) {
                this._request(this.dbUrl + encodeURIComponent(doc._id) + "?" + encodeOptions({
                    batch: batch
                }), {
                    method: 'PUT',
                    body: JSON.stringify(doc)
                }, function(err, result) {
                    if (err) return cb(err);
                    doc._rev = result.rev;
                    cb(null, result);
                });

            }
        ], function(err, result) {
            callback(err, result);
        });
    },
    tempView: function(mapFun, reduceFun, options, callback) {
        if (arguments.length === 3) {
            callback = options;
            options = undefined;
        }

        var body = {
            language: "javascript"
        };


        if (typeof(mapFun) != "string")
            mapFun = "(" + mapFun.toString() + ")";

        body.map = mapFun;

        if (!reduceFun) {
            if (typeof(reduceFun) != "string")
                reduceFun = "(" + reduceFun.toString() + ")";
            body.reduce = reduceFun;
        }

        if (options && options.options !== undefined) {
            body.options = options.options;
            delete options.options;
        }

        this._post(this.dbUrl + "/_temp_view?" + encodeOptions(options), {
            body: JSON.stringify(body)
        }, function(err, body) {
            callback(err, body);
        });
    },
    design: function(designName) {
        var dbUrl = this.dbUrl;
        return {
            view: function(view) {
                var viewPath = this.dbUrl + '/_design/' + designName + '/_view/' + view + '?' + encodeOptions(options);

            }
        };
    },
    view: function(viewname, options, keys, callback) {
        if (arguments.length === 2) {
            callback = options;
            options = keys = undefined;
        } else if (arguments.length === 3) {
            callback = keys;
            keys = undefined;
        }

        var viewParts = viewname.split('/'),
            viewPath = this.dbUrl + "/_design/" + viewParts[0] + "/_view/" + viewParts[1] + '?' + encodeOptions(options);

        if (!keys) {
            this._request(viewPath, 'GET', function(err, body) {
                callback(err, body);
            });
        } else {
            this._request(viewPath, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keys: keys
                })
            }, function(err, body) {
                callback(err, body);
            });
        }
    },
    designDocs: function(callback) {
        return this.allDocs('_design', '_design0', callback);
    },

    docHead: function(docid, callback) {
        if (docid === null || docid === undefined)
            return callback(new Error("docid must be provided"));

        this._request(this.dbUrl + '/' + docid, 'HEAD', function(err, body, res) {
            callback(err, res && res.headers);
        });
    },
    openDoc: function(docid, options, callback) {
        if (!callback && typeof options == 'function')
            callback = options, options = {};

        if (docid === null || docid === undefined)
            return callback(new Error("docid must be provided"));

        var url = this.dbUrl + '/' + docid + '?' + encodeOptions(options || {});

        this._request(url, 'GET', function(err, body) {
            callback(err, body);
        });
    },

    bulkSave: function(docs, options, callback) {
        // first prepoulate the UUIDs for new documents
        var newCount = 0;
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id === undefined)
                newCount++;
        }

        var newUuids = this.newUuids(docs.length);
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id === undefined)
                docs[i]._id = newUuids.pop();
        }

        var json = {
            "docs": docs
        };
        // put any options in the json
        for (var option in options) {
            json[option] = options[option];
        }

        this._request(this.dbUrl + "/_bulk_docs", {
            method: 'POST',
            body: JSON.stringify(json)
        }, function(err, results) {
            if (err && err.statusCode == 417) {
                return callback({
                    errors: results
                });
            }

            if (err)
                return callback(err);

            for (var i = 0; i < docs.length; i++) {
                if (results[i].rev)
                    docs[i]._rev = results[i].rev;
            }
            callback(err, results);
        });
    },
    deleteDoc: function(doc, callback) {
        this._request(this.dbUrl + '/' + encodeURIComponent(doc._id) + "?rev=" + doc._rev, 'DELETE', function(err, result) {
            if (err) return callback(err);
            if (result) {
                doc._rev = result.rev; //record rev in input document
                doc._deleted = true;
            }
            callback(err, result);
        });
    },
    // Deletes an attachment from a document
    deleteDocAttachment: function(doc, attachment_name, callback) {
        this._request(this.dbUrl + '/' + encodeURIComponent(doc._id) + "/" + attachment_name + "?rev=" + doc._rev, 'DELELTE', function(err, result) {
            result && (doc._rev = result.rev); //record rev in input document
            callback(err, result);
        });
    },

    // ==========================
    // Revisions
    // ==========================
    missingRevisions: function(callback) {
        this._post(this.dbUrl + '/_missing_revs', function(err, body) {
            console.log(err, body);
            callback(err, body);
        });
    },
    revisionsDiff: function(callback) {
        throw new Error('Not Implement Yet');
    },
    revisionsLimit: function() {
        var self = this;
        return {
            get: function(callback) {
                self._get(self.dbUrl + '/_revs_limit', function(err, limit) {
                    callback(err, limit);
                });
            },
            set: function(limit, callback) {
                self._put(self.dbUrl + '/_revs_limit', {
                    body: JSON.stringify(limit)
                }, function(err, st) {
                    callback(err, st);
                });
            }
        };
    },
    // ==========================
    // Security
    // ==========================
    security: function() {
        var self = this;
        return {
            get: function(callback) {
                self._get(self.dbUrl + '/_security', function(err, sec) {
                    callback(err, sec);
                });
            },
            set: function(security, callback) {
                self._put(self.dbUrl + '/_security', {
                    body: JSON.stringify(security)
                }, function(err, st) {
                    callback(err, st);
                });
            }
        };
    },
    /**
     *
     */

    // TODO: how to handle poll,  longpoll and continuous
    changes: function(filter, callback) {

    }
});