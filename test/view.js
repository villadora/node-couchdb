var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

describe.skip('view', function() {
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

    it('query', function(done) {
        db.registry.view('app/dependedUpon').query().limit(5).key('not').exec(function(err, rows) {
            done(err);
        });
    });

});