var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

describe('ddoc', function() {
    this.timeout(30000);

    var db, version;

    before(function(done) {
        db = new CouchDB(config.url);
        db.bind('registry');
        db.info(function(err, info) {
            version = info.version;
            done(err);
        });
    });


    if (config.user) {
        describe('require auth', function() {
            beforeEach(function(done) {
                db.auth(config.user, config.pass);
                db.bind('testdb');
                db.testdb.create(function(err) {
                    console.log(err);
                    done(err);
                });
            });

            afterEach(function(done) {
                db.testdb.destroy(function(err) {
                    db.unbind('testdb');
                    done(err);
                });
            });

        });
    }

    it('get', function(done) {
        db.registry.design('app').get(function(err, rs) {
            assert(rs);
            done(err);
        });
    });


});