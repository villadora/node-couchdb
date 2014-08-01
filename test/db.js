var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  semver = require('semver'),
  couchdb = require('../lib'),
  config = require('./test-config'),
  Database = require('../lib/db'),
  CouchDB = couchdb.CouchDB;

describe('dbs', function() {
  this.timeout(30000);

  var db, version;

  beforeEach(function(done) {
    db = new CouchDB(config.url, {
      request: require('request').defaults()
    });

    db.auth(config.user, config.pass);
    db.info(function(err, info) {
      version = info.version;
      db.bind('testdb').testdb.destroy(function(err) {
        db.testdb.create(function(err) {
          done(err);
        });
      });
    });
  });

  afterEach(function() {
    db.auth();
  });


  it('extend', function(done) {
    db.testdb.extend({
      visit: 0,
      information: function() {
        this.info.apply(this, arguments);
      }
    });

    assert.equal(db.testdb.visit, 0);
    db.testdb.information(function(err, info) {
      done(err);
    });
  });

  it.skip('follow with callback', function(done) {
    db.testdb.follow({
      include_docs: true
    }, function(err, data) {
      assert(data.doc);
      this.stop();
      done(err);
    });

    db.testdb.bulkSave([{
      _id: 'not',
      version: '1.2.3'
    }, {
      _id: 'pkg',
      version: '0.3.12'
    }]);
  });

  it.skip('follow with feed', function(done) {
    var feed = db.testdb.follow({
      include_docs: true
    });

    feed.on('change', function(change) {
      assert(change.doc);
      this.stop();
      done();
    });

    feed.on('error', function(err) {
      this.stop();
      done(err);
    });

    feed.follow();

    db.testdb.bulkSave([{
      _id: 'not',
      version: '1.2.3'
    }, {
      _id: 'pkg',
      version: '0.3.12'
    }]);
  });


  it('create', function(done) {
    assert.throws(function() {
      new Database();
    });

    var dbc = db.database('db_create');
    dbc.destroy(function() {
      dbc.create(function(err) {
        assert.equal(err, null, 'Failed to create database');
        dbc.info(function(err, data) {
          assert.equal(data.doc_count, 0);
          assert.equal(data.db_name, 'db_create');
          dbc.create(function(err) {
            assert.equal(err.error, 'file_exists');
            dbc.destroy(done);
          });
        });
      });
    });
  });

  it('newUuids', function() {
    var db = new Database('url');
    assert.throws(function() {
      db.newUuids(5);
    });
  });

  it('destroy', function(done) {
    var dbc = db.database('db_create');
    dbc.destroy(function() {
      dbc.create(function(err) {
        assert.equal(err, null, 'Failed to create database');
        dbc.destroy(function(err) {
          assert.equal(err, null, 'Failed to destroy database');
          done(err);
        });
      });
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


  it('fetch', function(done) {
    db.testdb.doc({
      _id: 'not',
      version: '1.2.3'
    }).create(function(err) {
      if (err) return done(err);
      db.testdb.fetch('not', function(err, doc) {
        assert(doc.version == '1.2.3');
        done(err);
      });
    });
  });

  it('mfetch', function(done) {
    db.testdb.bulkSave([{
      _id: 'not',
      version: '1.2.3'
    }, {
      _id: 'express',
      version: '3.4.5'
    }], function(err) {
      if (err) return done(err);
      db.testdb.mfetch(['not', 'express'], function(err, docs) {
        assert(docs.length == 2);
        done(err);
      });
    });
  });


  describe('allDocs', function() {
    beforeEach(function(done) {
      db.testdb.bulkSave([{
        _id: 'not',
        version: '1.2.3'
      }, {
        _id: 'express',
        version: '3.4.5'
      }], done);
    });


    it('normal', function(done) {
      db.testdb.allDocs(function(err, rows, total, offset) {
        if (err) return done(err);
        assert.equal(total, 2);
        db.testdb.allDocs(0, 1, function(err, rows, total, offset) {
          assert.equal(rows.length, 1);
          assert.equal(total, 2);
          assert.equal(offset, 0);
          done(err);
        });
      });
    });

    it('executor', function(done) {
      db.testdb.allDocs().limit(1).skip(0).execute(function(err, rows, total, offset) {
        assert.equal(rows.length, 1);
        assert.equal(total, 2);
        assert.equal(offset, 0);
        done(err);
      });
    });
  });

  describe('searchByKeys', function() {
    beforeEach(function(done) {
      db.testdb.bulkSave([{
        _id: '01',
        version: '0.0.0'
      }, {
        _id: 'express',
        version: '3.4.5'
      }, {
        _id: 'not',
        version: '1.2.3'
      }], done);
    });

    it('startkey,endkey', function(done) {
      db.testdb.searchByKeys('0', 'a', function(err, rows, total, offset) {
        if (err) return done(err);
        assert.equal(total, 3);
        assert.equal(offset, 0);
        assert.equal(rows.length, 1);
        db.testdb.select().betweenKeys('0', 'a').exec(function(err, rows, total, offset) {
          assert.equal(total, 3);
          assert.equal(offset, 0);
          assert.equal(rows.length, 1);
          done(err);
        });
      });
    });


    it('key', function(done) {
      db.testdb.searchByKeys('not', function(err, rows, total, offset) {
        if (err) return done(err);
        assert.equal(total, 3);
        assert.equal(offset, 2);
        assert.equal(rows.length, 1);
        db.testdb.searchByKeys('not', {}, function(err, rows, total, offset) {
          assert.equal(total, 3);
          assert.equal(offset, 2);
          assert.equal(rows.length, 1);
          done(err);
        });
      });
    });

    it('keys', function(done) {
      db.testdb.searchByKeys(['01', 'not', 'grunt'], function(err, rows, total) {
        assert.equal(rows.length, 3);
        assert.equal(total, 3);
        done(err);
      });
    });
  });

  describe('searchByIds', function() {
    beforeEach(function(done) {
      db.testdb.bulkSave([{
        _id: '01',
        version: '0.0.0'
      }, {
        _id: 'express',
        version: '3.4.5'
      }, {
        _id: 'not',
        version: '1.2.3'
      }], done);
    });

    it('id range', function(done) {
      db.testdb.searchByIds('0', 'a', function(err, rows, total, offset) {
        assert.equal(rows.length, 1);
        assert.equal(total, 3);
        assert.equal(offset, 0);
        done(err);
      });
    });

    it('id', function(done) {
      db.testdb.searchByIds('not', function(err, rows, total, offset) {
        if (err) return done(err);
        assert.equal(rows.length, 1);
        assert.equal(total, 3);
        assert.equal(offset, 2);
        db.testdb.searchByIds('not', {}, function(err, rows, total, offset) {
          assert.equal(rows.length, 1);
          assert.equal(total, 3);
          assert.equal(offset, 2);
          done(err);
        });
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

  describe('require auth', function() {
    beforeEach(function() {
      db.auth(config.user, config.pass);
    });

    it.skip('compact', function(done) {
      db.testdb.compact(done);
    });

    it('ensureCommit', function(done) {
      db.testdb.ensureCommit(done);
    });

    it('viewCleanup', function(done) {
      db.testdb.viewCleanup(done);
    });

    it('insert', function(done) {
      db.testdb.insert({
        kind: 'dog'
      }, function(err, doc) {
        if (err) return done(err);
        db.testdb.insert({
          kind: 'cat'
        }, 'cat1', function(err, doc) {
          assert(doc.id == 'cat1');
          done(err);
        });
      });
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
        if (err) return done(err);
        docs[0].name = "alexixs";
        db.testdb.bulkSave(docs, function(err, rs) {
          if (err) return done(err);
          db.testdb.allDocs({
            include_docs: true
          }, function(err, rs) {
            assert(rs[0].doc.name == 'alexixs');
            done(err);
          });
        });
      });
    });

    it('save', function(done) {
      db.testdb.save('oneperson', {
        name: 'jane',
        age: 25
      }, function(err) {
        if (err) return done(err);
        var doc = db.testdb.doc('oneperson');
        doc.open(function(err) {
          if (err) return done(err);
          db.testdb.save('oneperson', doc.doc, function(err) {
            done(err);
          });
        });
      });
    });


    it('revisions', function(done) {
      assert.throws(function() {
        db.testdb.revisionsDiff();
      });

      db.testdb.missingRevisions({
        "c6114c65e295552ab1019e2b046b10e": [
          "3-b06fcd1c1c9e0ec7c480ee8aa467bf3b",
          "3-0e871ef78849b0c206091f1a7af6ec41"
        ]
      }, function(err, body) {
        if (err) return done(err);
        var rl = db.testdb.revisionsLimit();
        rl.get(function(err, limit) {
          if (err) return done(err);
          rl.set(500, function(err, body) {
            done(err);
          });
        });
      });
    });

    it('security', function(done) {
      var s = db.testdb.security();
      s.get(function(err, sec) {
        if (err) return done(err);
        s.set(sec, done);
      });
    });

    it('tempView', function(done) {
      var docs = [{
        name: 'alex',
        age: 24
      }, {
        name: 'lee',
        age: 26
      }];

      db.testdb.bulkSave(docs, function(err, rs) {
        if (err) return done(err);
        db.testdb.tempView(function(doc) {
          emit(doc._id);
        }, '_count', function(err, rs) {
          assert.equal(rs.rows[0].value, 2);
          done(err);
        });
      });
    });
  });

});