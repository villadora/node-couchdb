var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

describe.only('ddoc', function() {
    var db, version;

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


    it('create & destroy', function(done) {
        var ddoc = db.testdb.design('test');
        ddoc.set(require('./test-ddoc')).create(function(err) {
            if (err) return done('Failed to create new design doc');
            ddoc.destroy(function(err) {
                if (err) return done('Failed to destroy new design doc');
                ddoc.exists(function(err, exists) {
                    assert.equal(err, null, 'Exists check failed');
                    assert(!exists);
                    done(err);
                });
            });
        });
    });

});