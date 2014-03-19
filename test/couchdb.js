var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;



describe('couchdb', function() {
    this.timeout(30000);

    var db;

    before(function(done) {
        db = new CouchDB(config.url);

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

        db.info(function(err, info) {
            version = info.version;
            done(err);
        });
    });


    it('allDbs', function(done) {
        db.allDbs(function(err, dbs) {
            assert(dbs.length);
            done(err);
        });
    });



    it('newUuids', function(done) {
        db.newUuids(5, function(err, uuids) {
            assert(uuids.length === 5);
            done(err);
        });
    });


    it('info', function(done) {
        db.info(function(err, info) {
            assert(info.version && info.uuid);
            done(err);
        });
    });



    it('existsDb', function(done) {
        if (semver.satisfies(version, '>=1.5'))
            db.existsDb('newdb_not_exists_222323232', function(err, exists) {
                assert.ok(!exists);
                done(err);
            });
        else
            done();
    });



    if (config.user) {
        describe('require auth', function() {

            before(function(done) {
                db.auth();
                db.login(config.user, config.pass, function(err, res) {
                    assert(res.ok);
                    done(err);
                });
            });


            after(function(done) {
                db.logout(function(err) {
                    db.auth(config.user, config.pass);
                    done(err);
                });
            });

            it('session', function(done) {
                db.session(function(err, sessio) {
                    done(err);
                });
            });


            it('stats', function(done) {
                db.stats(function(err, stat) {
                    assert(stat);
                    assert(stat.couchdb);
                    if (err) return done(err);
                    db.stats('request_time', function(err, stat) {
                        assert(stat.couchdb.request_time);
                        done(err);
                    });
                });
            });


            it('activeTasks', function(done) {
                db.activeTasks(function(err, tasks) {
                    assert(tasks instanceof Array);
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

            it('dbUpdates', function(done) {
                if (semver.satisfies(version, '>=1.4'))
                    db.dbUpdates(function(err, updates) {
                        console.log(err, updates);
                        done(err);
                    });
                else
                    done();
            });
        });
    }


    describe.skip('others', function() {
        it('restart', function(done) {
            db.restart(function(err) {
                done(err);
            });
        });


    });

});