var _ = require('underscore'),
    util = require('util'),
    qs = require('querystring'),
    Document = require('./doc'),
    Local = require('./local'),
    DesignDoc = require('./ddoc'),
    RequestBase = require('./base'),
    Executor = require('./exec');

module.exports = Database;

function Database(url, dbname, options) {
    options = options || {};

    RequestBase.call(this, options);
    this.url = url.replace(/\/$/, '');
    this.dbname = dbname;
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
    doc: function(doc, options) {
        return new Document(this.url, doc, options || this.options);
    },
    fetch: function(id, callback) {
        this.doc(id).open(callback);
    },
    mfetch: function(ids, callback) {
        this.searchByKeys(ids, {
            include_docs: true
        }, callback);
    },
    local: function(options) {
        return new Local(this.url, options || this.options);
    },
    design: function(designName, options) {
        return new DesignDoc(this.url + '/_design/' + designName, designName, options || this.options);
    },
    view: function(design, view, options) {
        if (typeof view != 'string') {
            options = view;
            var dv = design.split('/');
            design = dv[0];
            view = dv[1];
        }
        return this.design(design, options || this.options).view(view);
    },
    newUuids: function() {
        throw new Error('No newUuids method in Database');
    },
    /**
     * @couchdb 1.5
     */
    exists: function(callback) {
        this._head(this.url, function(err, body, res) {
            if (err && err.statusCode == 404)
                return callback(null, false);

            callback(err, !err, body);
        });
    },
    info: function(callback) {
        this._get(this.url, function(err, info) {
            callback(err, info);
        });
    },
    create: function(callback) {
        this._put(this.url, function(err, body) {
            if (body && body.error) {
                callback(err || body.reason);
            } else
                callback(err, body);
        });
    },
    destroy: function(callback) {
        this._delete(this.url, callback);
    },
    purge: function(docs, callback) {
        // TODO: format docs obj
        this._post(this.url + '/_purge', {
            body: JSON.stringify(docs || {})
        }, function(err, body) {
            callback(err, body);
        });
    },
    compact: function(callback) {
        this._post(this.url + '/_compact', callback);
    },
    compactDdoc: function(ddoc, callback) {
        this._post(this.url + '/_compact/' + ddoc, callback);
    },
    ensureCommit: function(callback) {
        this._post(this.url + '/_ensure_full_commit', callback);
    },
    viewCleanup: function(callback) {
        this._post(this.url + '/_view_cleanup', callback);
    },
    /**
     * @param {number} skip
     * @param {number} limit
     * @param {AllDocsOptions=} options
     * @param {function} callback
     */
    allDocs: function(skip, limit, options, callback) {
        var query = this.select();
        if (arguments.length === 0) {
            return query;
        } else if (arguments.length == 1) {
            callback = skip;
            skip = limit = undefined;
        } else if (arguments.length == 2 && typeof limit == 'function') {
            callback = limit;
            options = skip;
            skip = limit = undefined;
        } else if (arguments.length == 3 && typeof options == 'function') {
            callback = options;
            options = undefined;
        }


        (typeof skip == 'number') && query.skip(skip);
        (typeof limit == 'number') && query.limit(limit);

        if (options)
            query.set(options);

        query.execute(callback);
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
     * @param {string} startkey|keys
     * @param {string=} endkey
     * @param {AllDocsOptions=} options
     * @param {function} callback
     */
    searchByKeys: function(startkey, endkey, options, callback) {
        var key, keys;
        if (arguments.length == 2 && typeof endkey == 'function') {
            callback = endkey;
            if (startkey instanceof Array) {
                keys = startkey;
            } else {
                key = startkey;
            }
            endkey = startkey = undefined;
        } else if (arguments.length == 3 && typeof options == 'function') {
            callback = options;
            options = undefined;
            if (typeof endkey != 'string') {
                options = endkey;
                if (startkey instanceof Array) {
                    keys = startkey;
                } else {
                    key = startkey;
                }
            }
        }

        var query = this.select();
        if (!keys) {
            key && query.key(key);
            query.startkey(startkey || undefined).endkey(endkey || undefined).set(options).execute(callback);
        } else {
            query.keys(keys).set(options).execute(callback);
        }
    },
    /**
     * @param {string} startid
     * @param {string} endId
     * @param {AllDocsOptions=} options
     * @param {function} callback
     */
    searchByIds: function(startId, endId, options, callback) {
        if (arguments.length == 2 && typeof endId == 'function') {
            callback = endId;
            endId = startId;
        } else if (arguments.length == 3 && typeof options == 'function') {
            callback = options;

            if (typeof endId == 'string') {
                options = undefined;
            } else {
                options = endId;
                endId = startId;
            }
        }

        this.select().betweenIds(startId || undefined, endId || undefined).set(options).execute(callback);
    },
    /**
     *
     */
    select: function(options) {
        var self = this,
            executor = new Executor(Database.prototype.select.additions, 'skip', 'limit', 'descending', 'endkey', 'startkey', 'endkey_docid', 'startkey_docid',
                'group', 'group_level', 'include_docs', 'inclusive_end', 'key', 'reduce', 'stale', 'keys');
        executor.execute = function(callback) {
            var opts = _.clone(this.options);

            ['startkey', 'endkey', 'key'].forEach(function(p) {
                opts[p] && (opts[p] = JSON.stringify(opts[p]));
            });

            if (opts.keys && opts.keys.length) {
                var keys = opts.keys;
                delete opts.keys;
                self._post(self.url + '/_all_docs?' + qs.stringify(opts), {
                    body: JSON.stringify({
                        keys: keys
                    })
                }, function(err, body) {
                    if (err) return callback(err);
                    callback(err, body.rows, body.total_rows, body.offset, body);
                });
            } else
                self._get(self.url + '/_all_docs?' + qs.stringify(opts), function(err, body) {
                    if (err) return callback(err);
                    callback(err, body.rows, body.total_rows, body.offset, body.update_seq, body);
                });
        };

        executor.betweenKeys = function(startkey, endkey) {
            this.options.startkey = startkey;
            this.options.endkey = endkey;
            return this;
        };

        executor.betweenIds = function(startid, endid) {
            this.options.startkey_docid = startid;
            this.options.endkey_docid = endid;
            return this;
        };

        if (options)
            executor.set(options);

        return executor;
    },
    allDocsBySeq: function(options, keys, callback) {
        if (!keys) {
            this._request(this.uri + "/_all_docs_by_seq" + qs.stringify(options), 'GET', function(err, docs) {
                callback(err, docs);
            });
        } else {
            this._request(this.uri + "/_all_docs_by_seq" + qs.stringify(options), {
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

        this._post(this.url + "/_temp_view?" + qs.stringify(options), {
            body: JSON.stringify(body)
        }, function(err, body) {
            callback(err, body);
        });
    },
    /**
     * Create new or update docs in bulk
     * @param {Array} docs
     * @param {Object} options
     * @param {function} callback
     */
    bulkSave: function(docs, options, callback) {
        if (arguments.length == 2 && typeof options == 'function') {
            callback = options;
            options = {};
        }

        var json = {
            "docs": docs
        };
        // put any options in the json
        // all_or_nothing / new_edits
        for (var option in options) {
            json[option] = options[option];
        }

        this._request(this.url + "/_bulk_docs", {
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
                if (results[i].rev) {
                    (docs[i]._id) || (docs[i]._id = results[i].id);
                    docs[i]._rev = results[i].rev;
                }
            }
            callback(err, results);
        });
    },
    allDesignDocs: function(callback) {
        return this.searchByKeys('_design/', '_design0', function(err, ddocs) {
            callback(err, ddocs);
        });
    },
    // ==========================
    // Revisions
    // ==========================
    missingRevisions: function(callback) {
        this._post(this.url + '/_missing_revs', function(err, body) {
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
                self._get(self.url + '/_revs_limit', function(err, limit) {
                    callback(err, limit);
                });
            },
            set: function(limit, callback) {
                self._put(self.url + '/_revs_limit', {
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
                self._get(self.url + '/_security', function(err, sec) {
                    callback(err, sec);
                });
            },
            set: function(security, callback) {
                self._put(self.url + '/_security', {
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
        // use require('follow')
    }
});