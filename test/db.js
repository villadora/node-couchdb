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
        db.info(function(err, info) {
            version = info.version;
            db.bind('testdb').testdb.create(done);
        });
    });

    it('exists', function(done) {
        if (semver.satisfies(version, '>=1.5'))
            db.testdb.exists(function(err, exists) {
                assert(exists);
                done(err);
            });
        else
            done();
    });

    it('info', function(done) {
        db.testdb.info(function(err, info) {
            done(err);
        });
    });


    it.only('fetch', function(done) {
        db.testdb.doc({
            _id: 'not',
            version: '1.2.3'
        }).create(function(err) {
            if (err) return done(err);
            db.testdb.fetch('not', function(err, doc) {
                console.log(doc, err);
                assert.equals(doc.version, '1.2.3');
                done(err);
            });
        });
    });

    it('mfetch', function(done) {
        db.testdb.mfetch(['not', 'express'], function(err, docs) {
            done(err);
        });
    });


    describe('allDocs', function() {
        it('normal', function(done) {
            db.testdb.allDocs(0, 1, function(err, docs, total, offset) {
                done(err);
            });
        });

        it('executor', function(done) {
            db.testdb.allDocs().limit(1).skip(0).execute(function(err, rows, total, offset) {
                done(err);
            });
        });
    });

    describe('searchByKeys', function() {
        it('startkey,endkey', function(done) {
            db.testdb.searchByKeys('0', 'a', function(err, rows, total, offset) {
                done(err);
            });
        });


        it('key', function(done) {
            db.testdb.searchByKeys('not', function(err, rows, total, offset) {
                done(err);
            });
        });

        it('keys', function(done) {
            db.testdb.searchByKeys(['not', 'grunt'], function(err, rows, total, offset) {
                done(err);
            });
        });
    });

    describe('searchByIds', function() {
        it('id range', function(done) {
            db.testdb.searchByIds('0', 'a', function(err, rows, total, offset) {
                done(err);
            });
        });

        it('id', function(done) {
            db.testdb.searchByIds('a', function(err, rows, total, offset) {
                done(err);
            });
        });
    });

    it('allDesignDocs', function(done) {
        db.testdb.allDesignDocs(function(err, ddocs) {
            done(err);
        });
    });


    it('purge', function(done) {
        db.testdb.purge({
                id: []
            },
            done);
    });

    if (config.user) {
        describe('require auth', function() {
            before(function() {
                db.auth(config.user, config.pass);
            });

            it('create', function(done) {
                db.testdb.create(function(err) {
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
                db.testdb.tempView(function(doc) {
                    emit(doc._id);
                }, '_count', function(err, docs) {
                    console.log(err, docs);
                    done(err);
                });
            });

        });
    }

});