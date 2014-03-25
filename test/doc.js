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

            it('create', function(done) {
                var doc = db.testdb.doc({
                    _id: 'not',
                    name: 'alex',
                    age: 24
                });

                doc.create(function(err, rs) {
                    if (err) return done(err);
                    doc.create(true, function(err, rs) {
                        done(err);
                    });
                });
            });

            it('destroy', function(done) {
                var doc = db.testdb.doc({
                    _id: 'person',
                    name: 'john',
                    age: 33
                });

                doc.create(function(err, rs) {
                    if (err) return done(err);
                    doc.del(rs.rev, function(err) {
                        done(err);
                    });
                });
            });

            it.only('copy', function(done) {
                var doc = db.testdb.doc({
                    _id: 'john',
                    age: 25
                });
                doc.create(function(err) {
                    if (err) return done(err);
                    doc.copy('jack', function(err, rs) {
                        done(err);
                    });
                });
            });
        });
    }

    it('head', function(done) {
        db.registry.doc('not').head({
            revs: true,
            revs_info: true
        }, function(err, headers) {
            if (err && err.statusCode === 404) return done();
            done(err);
        });
    });


    it('exists', function(done) {
        db.registry.doc('not_exists').exists(function(err, e) {
            assert(!e);
            done(err);
        });
    });

    it('updateDoc', function() {
        var doc = db.registry.doc({
            name: 'john'
        });

        doc.updateDoc({
            name: 'jack'
        });

        assert(doc.getDoc().name == 'jack');
    });


    it('newDoc', function() {
        var doc = db.registry.doc({
            _id: 'jack johns',
            name: 'jack'
        });

        doc.newDoc();
        assert(!doc._id);

    });

});