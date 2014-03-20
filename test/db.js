var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

describe('dbs', function() {
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

    it('exists', function(done) {
        if (semver.satisfies(version, '>=1.5'))
            db.registry.exists(function(err, exists) {
                assert(exists);
                done(err);
            });
        else
            done();
    });

    it('info', function(done) {
        db.registry.info(function(err, info) {
            done(err);
        });
    });

    it.skip('view', function(done) {
        db.registry.view('app/dependedUpon', {
            start_key: '',
            end_key: 'a',
            group_level: 1
        }, function(err, doc) {
            console.log(err, doc);
            done(err);
        });
    });



    it('allDocs', function(done) {
        db.registry.allDocs('0', '1', function(err, docs, total, offset) {
            done(err);
        });
    });

    it.skip('designDocs', function(done) {
        db.registry.designDocs(function(err, ddocs) {
            assert(ddocs.length);
            done(err);
        });
    });

    it.skip('docHead', function(done) {
        db.registry.docHead('not', function(err, res) {
            done(err);
        });
    });

    it.skip('open', function(done) {
        db.registry.open('not', function(err, doc) {
            done(err);
        });
    });


    it('purge', function(done) {
        db.registry.purge({
                id: []
            },
            done);
    });

    if (config.user) {

        describe('require auth', function() {
            before(function() {
                db.auth(config.user, config.pass);
            });

            beforeEach(function(done) {
                db.bind('testdb').create(done);
            });


            afterEach(function(done) {
                db.testdb.destroy(done);
            });

            it('create', function(done) {
                db.registry.create(function(err) {
                    assert(err.statusCode == 412);
                    db.database('newdb').create(done);
                });
            });

            it('destroy', function(done) {
                db.database('newdb').destroy(function(err) {
                    if (err) return done(err);
                    db.existsDb('newdb', function(err, exists) {
                        assert(!exists);
                        done(err);
                    });
                });
            });

            it('compact', function(done) {
                db.testdb.compact(done);
            });

            it('ensureCommit', function(done) {
                db.testdb.ensureCommit(done);
            });

            it('viewCleanup', function(done) {
                db.testdb.viewCleanup(done);
            });

            it.only('tempView', function(done) {
                db.registry.tempView(function(doc) {}, '_count', function() {
                    done();
                });
            });

            it.skip('query', function(done) {
                db.registry.query(function(doc) {
                        if (!doc || doc.deprecated) return;
                        if (doc._id.match(/^npm-test-.+$/) &&
                            doc.maintainers &&
                            doc.maintainers[0].name === 'isaacs')
                            return;
                        var l = doc['dist-tags'] && doc['dist-tags'].latest;
                        if (!l) return;
                        l = doc.versions && doc.versions[l];
                        if (!l) return;
                        var desc = doc.description || l.description || '';
                        var readme = doc.readme || l.readme || '';
                        var d = l.dependencies;
                        if (!d) return;
                        for (var dep in d) {
                            emit([dep, doc._id, desc, readme], 1);
                        }
                    }, '_sum',
                    function(err, docs) {
                        console.log(err, docs);
                        done(err);
                    });
            });

        });
    }

});