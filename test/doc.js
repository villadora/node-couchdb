var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    fs = require('fs'),
    semver = require('semver'),
    couchdb = require('../lib'),
    config = require('./test-config'),
    CouchDB = couchdb.CouchDB;

describe('doc', function() {
    var db, version;
    this.timeout(10000);
    before(function(done) {
        db = new CouchDB(config.url);
        db.bind('testdb');
        db.testdb.destroy(function() {
            db.testdb.create(function(err) {
                if (err) return done('Failed to create testdb');
                db.testdb.insert({
                    _id: 'test',
                    name: 'not'
                }, function(err) {
                    if (err) return done('Failed to insert doc');
                    db.info(function(err, info) {
                        version = info.version;
                        done(err);
                    });
                });
            });
        });
    });


    after(function(done) {
        // db.testdb.destroy(done);
        done();
    });


    describe.only('attachment', function() {
        var doc;

        before(function(done) {
            doc = db.testdb.doc('test');
            doc.open(done);
        });

        it('attach', function(done) {
            doc.attach('plain.txt', 'test content plain text', 'text/plain', function(err, body) {
                var s = fs.createReadStream(path.resolve(__dirname, './logo.png')).pipe(
                    doc.attach('logo.png', null, 'image/png'));
                s.on('end', function() {
                    done(err);
                });
            });
        });

        it('get', function(done) {
            doc.attach('plain.txt', 'test content plain text', 'text/plain', function(err, body) {
                doc.getAttachment('plain.txt', function(err, buffer) {
                    assert(!err, 'Failed to get attachment');
                    assert.equal(buffer.toString(), 'test content plain text');
                    done(err);
                });
            });
        });

        it('delete', function(done) {
            doc.delAttachment('logo.png', function(err, body) {
                if (err) return done(err);
                doc.getAttachment('logo.png', function(err, buffer) {
                    assert.equal(err.statusCode, 404, 'Attachment should be deleted');
                    done();
                });
            });
        });
    });

    it('open', function(done) {
        db.testdb.doc('test').open(function(err, doc) {
            assert.equal(doc.name, 'not');
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

    it('copy', function(done) {
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


    it('head', function(done) {
        db.testdb.doc('test').head({
            revs: true,
            revs_info: true
        }, function(err, headers) {
            assert(headers);
            done(err);
        });
    });


    it('exists', function(done) {
        db.testdb.doc('not_exists').exists(function(err, e) {
            assert(!e);
            done(err);
        });
    });

    it('updateDoc', function() {
        var doc = db.testdb.doc({
            name: 'john'
        });

        doc.update({
            name: 'jack'
        });

        assert(doc.get().name == 'jack');
    });


    it('new', function() {
        var doc = db.testdb.doc({
            _id: 'jack johns',
            name: 'jack'
        });

        doc.new();
        assert(!doc._id);

    });

});