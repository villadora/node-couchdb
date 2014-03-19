var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

// require auth, skip if no auth info
if (!config.user)
    return;

describe('config', function() {
    this.timeout(30000);

    var db;

    before(function(done) {
        db = new CouchDB(config.url);
        db.login(config.user, config.pass, done);
    });


    it('all', function(done) {
        db.config().all(function(err, config) {
            assert(config, 'config must not empty');
            done(err);
        });
    });


    it('get', function(done) {
        db.config().get('log', 'level', function(err, level) {
            done(err);
        });
    });

    it('set', function(done) {
        db.config().set('log', 'level', Math.random() > 0.5 ? 'info' : 'debug', function(err, oldVal) {
            done(err);
        });
    });


    it('del', function(done) {
        db.config().del('log', 'level', function(err, oldVal) {
            done(err);
        });
    });


    describe('section', function() {
        var log;
        before(function() {
            log = db.config().section('log');
        });

        it('get', function(done) {
            log.get('level', function(err, val) {
                done(err);
            });
        });

        it('set', function(done) {
            log.set('level', 'info', function(err, oldVal) {
                done(err);
            });
        })

        it('del', function(done) {
            log.del('level', function(err, oldVal) {
                done(err);
            });
        });

    });


});