var assert = require('assert'),
    _ = require('underscore'),
    util = require('util'),
    url_module = require('url'),
    path = require('path'),
    ConfigProto = require('./config'),
    Database = require('./db'),
    RequestBase = require('./base').RequestBase;


function CouchDB(url, options) {
    RequestBase.call(this, options);
    this.url = this.__url = url;
    this.options = options || {};
    if (this.options.username && this.options.password) {
        this.url = [this.options.username, ':', this.options.password, this.url].join('');
    }

    this.bindedDBs = {};

    this.uuids_cache = [];

    this.config = Object.create(this);
    _.extend(this.config, ConfigProto);
}


util.inherits(CouchDB, RequestBase);

CouchDB.prototype.bind = function(dbname, options) {
    if (this.hasOwnProperty(dbname) && !this.bindedDBs[dbname]) {
        throw new Error('Invalid dbname for bind: ' + dbname);
    }

    var db = this[dbname] = this.database(dbname, options);

    this.bindedDBs[dbname] = true;
    return db;
};

CouchDB.prototype.unbind = function(dbname) {
    if (this.hasOwnProperty(dbname) && this.bindedDBs[dbname]) {
        delete this[dbname];
        delete this.bindedDBs[dbname];
    }
};

_.extend(CouchDB.prototype, {
    stats: function(callback) {
        this._get(url_module.resolve(this.url, '_stats'), function(err, stat, res) {
            callback(err, stat);
        });
    },
    version: function(callback) {
        this._get(this.url, function(err, version, res) {
            callback(err, version);
        });
    }
});


CouchDB.prototype.allDbs = function(callback) {
    this._request(url_module.resolve(this.url, '/_all_dbs'), function(err, alldbs, res) {
        callback(err, alldbs);
    });
};

CouchDB.prototype.database = function(dbname, options) {
    var db = new Database(this.url, dbname, options || this.options);
    db.newUuids = _.bind(this.newUuids, this);
    return db;
};


CouchDB.prototype.replicate = function(source, target, options, callback) {
    if (typeof options == 'function') {
        callbak = options;
        options = undefined;
    }

    options = options || options;

    var headers = options.headers || {};

    this._post(url_module.resolve(this.url, "/_replicate"), {
        headers: headers,
        body: JSON.stringify({
            source: source,
            target: target
        })
    }, function(err, body) {
        callback(err, body);
    });
};

CouchDB.prototype.newUuids = function(n, callback) {
    if (this.uuids_cache.length >= n) {
        var uuids = this.uuids_cache.slice(this.uuids_cache.length - n);
        if (this.uuids_cache.length - n === 0) {
            this.uuids_cache = [];
        } else {
            this.uuids_cache =
                this.uuids_cache.slice(0, this.uuids_cache.length - n);
        }
        return callback(err, uuids);
    } else {
        // cache 100 ids for future usage
        this._get("/_uuids?count=" + (100 + n), function(err, result) {
            if (err) return callback(err);
            if (result && result.uuids) {
                this.uuids_cache =
                    this.uuids_cache.concat(result.uuids.slice(0, 100));
                callback(err, result.uuids.slice(100));
            } else
                callback(err, []);
        });
    }
};

// TODO: session manage
CouchDB.prototype.login = function(username, passwd, callback) {

};

CouchDB.prototype.logout = function(callback) {

};

module.exports.CouchDB = CouchDB;