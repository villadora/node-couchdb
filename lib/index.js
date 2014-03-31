var assert = require('assert'),
    events = require('events'),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    url_module = require('url'),
    path = require('path'),
    Config = require('./config'),
    Database = require('./db'),
    RequestBase = require('./base'),
    encodeOptions = RequestBase.encodeOptions;


function CouchDB(url, options) {
    RequestBase.call(this, options);
    this.url = url;
    this.bindedDBs = {};
}


util.inherits(CouchDB, RequestBase);

_.extend(CouchDB.prototype, {
    config: function(options) {
        return new Config(this.url, options || this.options);
    },
    /**
     * @param {string} dbname
     * @param {Object=} options if no options is passed the Database will share the same options as CouchDB
     */
    database: function(dbname, options) {
        var db = new Database(this.url, dbname, options || this.options);
        db.newUuids = this.newUuids.bind(this);
        return db;
    },
    bind: function(dbname, options) {
        if (this.hasOwnProperty(dbname) && !this.bindedDBs[dbname]) {
            throw new Error('Invalid dbname for bind: ' + dbname);
        }

        var db = this[dbname] = this.database(dbname, options || this.options);

        this.bindedDBs[dbname] = true;
        return db;
    },
    unbind: function(dbname) {
        if (this.hasOwnProperty(dbname) && this.bindedDBs[dbname]) {
            delete this[dbname];
            delete this.bindedDBs[dbname];
        }
        return this;
    },
    existsDb: function(dbname, callback) {
        return new Database(this.url, dbname, this.options).exists(callback);
    },
    auth: function(user, pass) {
        if (user) {
            this.options.auth = {
                user: user
            };

            pass && (this.options.auth.pass = pass);
        } else {
            delete this.options.auth;
        }
        return this;
    },
    /** 
     * read version information
     * @param {function} callback
     */
    info: function(callback) {
        this._get(this.url, function(err, info, res) {
            callback(err, info);
        });
    },
    /**
     * @callback statCallback
     * @param {Object} err
     * @param {}
     */
    /**
     * @param {string|number} statisticId
     * @param {statCallback} callback
     * @auth
     */
    stats: function(statisticId, callback) {
        if (typeof statisticId == 'function' && callback === undefined) {
            callback = statisticId;
            statisticId = undefined;
        }

        this._get(url_module.resolve(this.url, '_stats') + (statisticId ? ('/couchdb/' + statisticId) : ''),
            function(err, stat, res) {
                callback(err, stat);
            });
    },
    /**
     * List of running tasks
     * @param {function} callback
     * @auth
     */
    activeTasks: function(callback) {
        this._get(url_module.resolve(this.url, '_active_tasks'), function(err, tasks, res) {
            callback(err, tasks);
        });
    },
    /**
     * @param {function} callback
     */
    allDbs: function(callback) {
        this._get(url_module.resolve(this.url, '_all_dbs'), function(err, alldbs, res) {
            callback(err, alldbs);
        });
    },
    newUuids: function(n, callback) {
        var self = this;
        self.uuids_cache = self.uuids_cache || [];

        if (self.uuids_cache.length >= n) {
            var uuids = self.uuids_cache.slice(self.uuids_cache.length - n);
            if (self.uuids_cache.length - n === 0) {
                self.uuids_cache = [];
            } else {
                self.uuids_cache =
                    self.uuids_cache.slice(0, self.uuids_cache.length - n);
            }
            return callback(err, uuids);
        } else {
            // cache 100 ids for future usage
            this._get(url_module.resolve(this.url, "/_uuids?count=" + (100 + n)), function(err, result) {
                if (err) return callback(err);
                if (result && result.uuids) {
                    self.uuids_cache =
                        self.uuids_cache.concat(result.uuids.slice(0, 100));
                    callback(err, result.uuids.slice(100));
                } else
                    callback(err, []);
            });
        }
    },

    /**
     *
     */
    restart: function(callback) {
        this._post(url_module.resolve(this.url, '_restart'), function(err, body) {
            callback(err);
        });
    },
    /**
     * watch db updates events
     *
     * @param {number} timeout
     * @couchdb 1.4
     */
    dbUpdates: function(timeout, callback) {
        if (arguments.length == 1) {
            if (typeof timeout == 'function') {
                callback = timeout;
                timeout = 0;
            }
        }

        var params = {};

        if (timeout)
            params.timeout = timeout;

        if (callback)
            params.feed = 'longpoll';
        else
            params.feed = 'continuous';

        if (callback)
            this._get(url_module.resolve(this.url, '_db_updates') + '?' + encodeOptions(params), function(err, updates, res) {
                callback(err, updates);
            });
        else {
            // TODO: publish continues event
            var bus = new events.EventEmitter();
            return bus;
        }
    },
    /**
     * @param {number} bytes
     * @param {number}  offset
     * @parma {function} callback
     */
    log: function(bytes, offset, callback) {
        if (typeof offset == 'function' && callback === undefined) {
            callback = offset;
            offset = undefined;
        } else if (typeof bytes == 'function' && offset === undefined && callback === undefined) {
            callback = bytes;
            bytes = undefined;
        }

        var query = {};
        (bytes !== undefined) && (query.bytes = bytes);
        (offset !== undefined) && (query.offset = offset);

        this._get(url_module.resolve(this.url, '_log') + '?' + encodeOptions(query), function(err, body) {
            callback(err, body || '');
        });
    },
    replicate: function(source, target, options, callback) {
        if (typeof options == 'function') {
            callbak = options;
            options = undefined;
        }

        options = options || {};

        this._post(url_module.resolve(this.url, "/_replicate"), {
                body: JSON.stringify(_.extend({
                    source: source,
                    target: target
                }, options))
            },
            function(err, body) {
                callback(err, body);
            });
    },

    /**
     * @auth
     */
    allDesignDocs: function(callback) {
        var self = this;
        self.allDbs(function(err, dbs) {
            if (err) return callback(err);

            var task = {};
            dbs.forEach(function(db) {
                task[db] = function(cb) {
                    self.database(db).allDesignDocs(function(err, ddocs) {
                        cb(err, ddocs);
                    });
                };
            });

            async.parallel(task, function(err, data) {
                callback(err, data);
            });
        });
    },
    // ========================
    // Session Management
    // ========================
    login: function(username, passwd, callback) {
        this.options.requestOpts.jar = require('request').jar();
        this._post(url_module.resolve(this.url, '_session'), {
            body: {
                name: username,
                password: passwd
            }
        }, function(err, body, res) {
            callback(err, body);
        });
    },
    logout: function(callback) {
        var self = this;
        this._delete(url_module.resolve(this.url, '_session'), function(err, body) {
            delete self.options.requestOpts.jar;
            callback(err, body);
        });
    },
    /**
     * @callback sessionCallback
     * @param {object} err
     * @param {object} info session information
     */
    /**
     * @param {sessionCallback} callback
     */
    session: function(callback) {
        this._get(url_module.resolve(this.url, '_session'), function(err, body) {
            callback(err, body);
        });
    }
});



module.exports.CouchDB = CouchDB;