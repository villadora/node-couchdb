var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  semver = require('semver'),
  couchdb = require('../lib'),
  config = require('./test-config'),
  CouchDB = couchdb.CouchDB;

describe('view', function() {
  var db;

  before(function(done) {
    db = new CouchDB(config.url);
    db.bind('testdb');
    db.login(config.user, config.pass, function(err) {
      if (err) return done(err);

      db.testdb.destroy(function() {
        db.testdb.create(function(err) {
          if (err) return done('Failed to create testdb');
          db.testdb.bulkSave(require('./test-data'), function(err, rs) {
            if (err) return done("Failed to save documents");
            db.testdb.design('article').set(require('./test-ddoc')).create(function(err) {
              if (err) return done("Failed to create design document");
              db.info(function(err, info) {
                version = info.version;
                done(err);
              });
            });
          });
        });
      });
    });
  });

  after(function(done) {
    db.logout(done);
  });

  it('betweenIds', function(done) {
    db.testdb.view('article/all').query().betweenIds('couchdb-design', 'great-book').exec(function(err, docs) {
      done(err);
    });
  });

  it('betweenKeys', function(done) {
    db.testdb.view('article/all').query().betweenKeys('couchdb-design', 'great-book').exec(function(err, docs) {
      done(err);
    });
  });


  it('fetch', function(done) {
    db.testdb.view('article/all').fetch('great-book', function(err, docs) {
      assert(docs[0].key == 'great-book');
      done(err);
    });
  });

  it('mfetch', function(done) {
    db.testdb.view('article/all').mfetch(['great-book', 'couchdb-design'], function(err, docs) {
      assert.equal(docs.length, 2);
      done(err);
    });
  });

  it('query all', function(done) {
    db.testdb.view('article/all').query(function(err, rows, total, offset) {
      if (err) return done('View query failed');
      assert(rows.length);
      done(err);
    });
  });

  it('query with options', function(done) {
    db.testdb.view('article/all').query({
      limit: 5
    }).exec(function(err, rows, total, offset) {
      if (err) return done('View query failed');
      assert(rows.length);
      done(err);
    });
  });



  it('query', function(done) {
    db.testdb.view('article/all').query().limit(5).exec(function(err, rows, total, offset) {
      if (err) return done('View query failed');
      assert(rows.length);
      done(err);
    });
  });

  it('key parse error', function(done) {
    var key = [];
    key.push(key);
    db.testdb.view('article/all').query().key(key).exec(function(err) {
      assert(err && err instanceof TypeError);
      done();
    });
  });

});
