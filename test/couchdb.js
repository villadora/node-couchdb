var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    couchdb = require('../lib'),
    config = require('./config'),
    CouchDB = couchdb.CouchDB;


describe('couchdb', function() {
    this.timeout(30000);

    var db;

    before(function() {
        // db = new CouchDB('http://isaacs.iriscouch.com/');
        db = new CouchDB(config.url);
        db.auth(config.user, config.pass);

        var cacheMapper = function cachePathMapper(options, callback) {
            // no cache by default
            var url = url_module.parse(options.url || options.uri),
                regexp = /^\/registry\/([a-z-]+)/,
                mc = regexp.exec(url.pathname),
                filePath = null;

            if (mc && mc.length) {
                filePath = path.resolve(__dirname, '../.npm_cache/registry/' + mc[1] + '.json');
            }

            callback(null, filePath);
        };

    });


    it('allDbs', function(done) {
        db.allDbs(function(err, dbs) {
            console.log(dbs);
            assert(dbs.length);
            done(err);
        });
    });

    it('stats', function(done) {
        db.stats(function(err, stat) {
            console.log(stat);
            assert(stat);
            if (err) return done(err);
            db.stats('request_time', function(err, stat) {
                console.log(stat);
                done(err);
            });
        });
    });

    it('version', function(done) {
        db.version(function(err, version) {
            assert(version.version && version.uuid);
            done(err);
        });
    });

    it('activeTasks', function(done) {
        db.activeTasks(function(err, tasks) {
            assert(tasks instanceof Array);
            done(err);
        });
    });

    it.skip('restart', function(done) {
        db.restart(function(err) {
            done(err);
        });
    });


    // require couchdb 1.4
    it.skip('dbUpdates', function(done) {
        db.dbUpdates(function(err, updates) {
            console.log(updates);
            done(err);
        });
    });

    it('newUuids', function(done) {
        db.newUuids(5, function(err, uuids) {
            assert(uuids.length === 5);
            done(err);
        });
    });


    it('log', function(done) {
        db.log(function(err, logs) {
            if (err) return done(err);
            assert(typeof logs == 'string');
            assert(logs.length > 0);

            db.log(0, function(err, logs) {
                if (err) return done(err);
                assert(logs.length === 0);
                db.log(50, 10,
                    function(err, logs) {
                        done(err);
                    });
            });
        });
    });

    it('allDesignDocs', function(done) {
        db.allDesignDocs(function(err, ddocs) {
            assert(ddocs);
            done(err);
        });
    });

});