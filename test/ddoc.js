var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  fs = require('fs'),
  semver = require('semver'),
  couchdb = require('../lib'),
  config = require('./test-config'),
  CouchDB = couchdb.CouchDB;

describe('ddoc', function() {
  var db, version;

  before(function(done) {
    db = new CouchDB(config.url);
    db.login(config.user, config.pass, function(err) {
      if (err) return done(err);
      db.bind('testdb');
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

  it('info', function(done) {
    var ddoc = db.testdb.designDoc('article');
    ddoc.info(function(err, info) {
      if (err) return done('Failed to get info of designDoc');
      done(err);
    });
  });

  it('create & destroy', function(done) {
    var ddoc = db.testdb.design('test');
    ddoc.set(require('./test-ddoc')).create(function(err) {
      if (err) return done('Failed to create new design ddoc');
      ddoc.destroy(function(err) {
        if (err) return done('Failed to destroy new design ddoc');
        ddoc.exists(function(err, exists) {
          assert.equal(err, null, 'Exists check failed');
          assert(!exists);
          done(err);
        });
      });
    });
  });

  it('copy', function(done) {
    var ddoc = db.testdb.design('article');
    ddoc.copy('_design/another_article', function(err, rs) {
      if (err) return done('Failed to copy design document');
      db.testdb.design('another_article').exists(function(err, exists) {
        assert.equal(exists, true, 'Copy destination does not exist!');
        db.testdb.design('another_article').open(function() {
          this.del(done);
        });
      });
    });
  });

  it('show', function(done) {
    var ddoc = db.testdb.design('article');
    ddoc.show('content').get(function(err, body, res) {
      if (err) return done(err);
      ddoc.show('content').doc('great-book', function(err, body, res) {
        assert(body);
        assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
        done(err);
      });
    });
  });


  it('list', function(done) {
    var ddoc = db.testdb.design('article');
    ddoc.list('short').view('all', function(err, body, res) {
      assert(body && body instanceof Array);
      assert.equal(body.length, 2);
      done(err);
    });
  });


  it('update', function(done) {
    var ddoc = db.testdb.design('article');
    ddoc.update('change', 'great-book', function(err, body) {
      done(err);
    });
  });

  describe('attachment', function() {
    var ddoc;
    before(function(done) {
      ddoc = db.testdb.design('test');
      ddoc.set(require('./test-ddoc')).create(function(err) {
        if (err) return done('Failed to create new design ddoc');
        ddoc.open(done);
      });
    });

    it('save attachment', function(done) {
      ddoc.rev(undefined).open(function(err) {
        assert.equal(err, null, 'Fail to open document');
        ddoc.attach('plain.txt', 'body { font-size:12pt; }', 'text/css');
        ddoc.save(function(err, rs) {
          done(err);
        });
      });
    });

    it('add many', function(done) {
      ddoc.addAttachment([{
        name: 'place.css',
        content_type: 'text/css',
        data: 'body { font-size: 12px; }'
      }, {
        name: 'script.js',
        content_type: 'script/javascript',
        data: 'window.onload(function() {})'
      }], function(err, rs) {
        done(err);
      });
    });

    it('add', function(done) {
      ddoc.addAttachment('plain.txt', 'test content plain text', 'text/plain', function(err, body) {
        var s = fs.createReadStream(path.resolve(__dirname, './logo.png')).pipe(
          ddoc.addAttachment('logo.png', null, 'image/png'));
        s.on('end', function() {
          done(err);
        });
      });
    });

    it('get', function(done) {
      ddoc.addAttachment('plain.txt', 'test content plain text', 'text/plain', function(err, body) {
        ddoc.getAttachment('plain.txt', function(err, buffer) {
          assert(!err, 'Failed to get attachment');
          assert.equal(buffer.toString(), 'test content plain text');
          done(err);
        });
      });
    });

    it('delete', function(done) {
      ddoc.delAttachment('logo.png', function(err, body) {
        if (err) return done(err);
        ddoc.getAttachment('logo.png', function(err, buffer) {
          assert.equal(err.statusCode, 404, 'Attachment should be deleted');
          done();
        });
      });
    });
  });


});