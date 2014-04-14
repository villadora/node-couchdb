var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

describe('view', function() {
    var db;

    before(function(done) {
        db = new CouchDB(config.url);
        db.bind('testdb');
        db.testdb.destroy(function() {
            db.testdb.create(function(err) {
                if (err) return done('Failed to create testdb');
                db.testdb.bulkSave(require('./test-data'), function(err, rs) {
                    if (err) return done("Failed to save documents");
                    db.testdb.design('article').set(require('./test-ddoc')).create(function(err) {
                        if (err) return done("Failed to create design document");
                        db.info(function(err, info) {
                            version = info.version;
                            done(err);
                        });
                    });
                });
            });
        });
    });


    it('query', function(done) {
        db.testdb.view('article/all').query().limit(5).exec(function(err, rows, total, offset) {
            if (err) return done('View query failed');
            assert(rows.length);
            done(err);
        });
    });

});