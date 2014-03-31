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

    it('getDoc', function(done) {
        db.registry.getDoc('not', function(err, doc) {
            done(err);
        });
    });

    it('mgetDocs', function(done) {
        db.registry.mgetDocs(['not', 'express'], function(err, docs) {
            done(err);
        });
    });


    describe('allDocs', function() {
        it('normal', function(done) {
            db.registry.allDocs(0, 1, function(err, docs, total, offset) {
                done(err);
            });
        });

        it('executor', function(done) {
            db.registry.allDocs().limit(1).skip(0).execute(function(err, rows, total, offset) {
                done(err);
            });
        });
    });

    describe('searchByKeys', function() {
        it('startkey,endkey', function(done) {
            db.registry.searchByKeys('0', 'a', function(err, rows, total, offset) {
                done(err);
            });
        });


        it('key', function(done) {
            db.registry.searchByKeys('not', function(err, rows, total, offset) {
                done(err);
            });
        });

        it('keys', function(done) {
            db.registry.searchByKeys(['not', 'grunt'], function(err, rows, total, offset) {
                done(err);
            });
        });
    });

    describe('searchByIds', function() {
        it('id range', function(done) {
            db.registry.searchByIds('0', 'a', function(err, rows, total, offset) {
                done(err);
            });
        });

        it('id', function(done) {
            db.registry.searchByIds('a', function(err, rows, total, offset) {
                done(err);
            });
        });
    });

    it('allDesignDocs', function(done) {
        db.registry.allDesignDocs(function(err, ddocs) {
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

            it('bulkSave', function(done) {
                var docs = [{
                    name: 'alex',
                    age: 24
                }, {
                    name: 'lee',
                    age: 26
                }];

                db.testdb.bulkSave(docs, function(err, rs) {
                    docs[0].name = "alexixs";
                    db.testdb.bulkSave(docs, function(err, rs) {
                        db.testdb.allDocs({
                            include_docs: true
                        }, function(err, rs) {
                            assert(rs[0].doc.name == 'alexixs');
                            done(err);
                        });
                    });
                });
            });

            it('tempView', function(done) {
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