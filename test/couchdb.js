var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  semver = require('semver'),
  couchdb = require('../lib'),
  config = require('./test-config'),
  CouchDB = couchdb.CouchDB;



describe('couchdb', function() {
  this.timeout(3000);

  var db, version;

  before(function(done) {
    db = new CouchDB(config.url);
    db.login(config.user, config.pass, function(err) {
      if (err) return done(err);
      db.info(function(err, info) {
        version = info.version;
        done(err);
      });
    });
  });

  after(function(done) {
    db.logout(done);
  });

  it('bind', function() {
    assert.throws(function() {
      db.bind('info');
    }, /Invalid dbname/, 'Must throw error');

    // bind twice
    db.bind('testdb');
    var old = db.testdb;
    db.bind('testdb');
    assert(db.testdb !== old);
  });



  it('unbind', function() {
    db.unbind('testdb'); // do nothing, no error
    db.bind('testdb');
    assert(db.testdb);
    db.unbind('testdb');
    assert(!db.testdb);
  });

  it('allDbs', function(done) {
    db.allDbs(function(err, dbs) {
      done(err);
    });
  });


  it('newUuids', function(done) {
    db.newUuids(5, function(err, uuids) {
      assert(uuids.length === 5); // cache 100 records
      db.newUuids(10, function(err, uuids) {
        assert(uuids.length === 10); // return cached records
        db.newUuids(90, function(err, uuids) { // read all the data from cache
          done(err);
        });
      });
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



  it('session', function(done) {
    db.session(function(err, session) {
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
    if (semver.satisfies(version, '>=1.4')) {
      db.dbUpdates(function(err, updates) {
        db.database('newtestdb').destroy(function(err1) {
          if (err) return done(err);
          done(err1);
        });
      });

      setTimeout(function() {
        db.database('newtestdb').create();
      }, 500);
    } else
      done();
  });


  it.skip('restart', function(done) {
    db.restart(function(err) {
      done(err);
    });
  });

});
