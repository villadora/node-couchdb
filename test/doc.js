var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  fs = require('fs'),
  semver = require('semver');

var couchdb = require('../lib');
var config = require('./test-config');
var CouchDB = couchdb.CouchDB;
var Document = require('../lib/doc.js');

describe('doc', function() {
  var db, version;
  this.timeout(10000);
  before(function(done) {
    db = new CouchDB(config.url);
    db.login(config.user, config.pass, function(err) {
      if (err) return done(err);
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
  });


  after(function(done) {
    db.logout(done);
  });


  describe('attachment', function() {
    var doc;

    before(function(done) {
      doc = db.testdb.doc({});
      doc.create(function(err) {
        doc.open(done);
      });
    });


    it('id && revision', function(done) {
      db.testdb.doc({}).addAttachment('place.css',
        'body { font-size: 12px', 'text/css', function(err) {
          assert.equal(err.message, 'docid must be provided');
          db.testdb.doc({
            _id: 'testid'
          }).addAttachment('x.txt', 'content', 'plain/txt', function(err) {
            assert.equal(err.message, 'revision must be provided');
            done();
          });
        });
    });


    it('attach', function(done) {
      var d = db.testdb.doc({});
      d.attach([{
        name: 'place.css',
        content_type: 'text/css',
        data: 'body { font-size: 12px; }'
      }, {
        name: 'script.js',
        content_type: 'script/javascript',
        data: 'window.onload(function() {})'
      }]).create(function(err) {
        if (err) return done(err);
        d.attach({
          'test.js': {
            type: 'script/javascript',
            data: 'function() {}'
          }
        }).save(function(err) {
          done(err);
        });
      });
    });


    it('save attachment', function(done) {
      doc.rev(undefined).open(function(err) {
        assert.equal(err, null, 'Fail to open document');
        doc.attach('plain.txt', 'body { font-size:12pt; }', 'text/css');
        doc.save(function(err, rs) {
          if (err) return done(err);

          var plainTxt = doc.attachment('plain.txt');
          plainTxt.get(function(err, body) {
            if (err) return done(err);
            assert.equal(body, 'body { font-size:12pt; }');
            plainTxt.update('body { font-size:14pt; }', 'text/css', function(err) {
              if (err) return done(err);
              plainTxt.get(function(err, body) {
                if (err) return done(err);
                assert.equal(body, 'body { font-size:14pt; }');
                done(err);
              });
            });
          });
        });
      });
    });

    it('add many', function(done) {
      doc.addAttachment([{
        name: 'place.css',
        content_type: 'text/css',
        data: 'body { font-size: 12px; }'
      }, {
        name: 'test.txt',
        type: 'plain/txt',
        data: 'plain text content'
      }], function(err, rs) {
        if (err) return done(err);
        doc.addAttachment({
          'script.js': {
            content_type: 'script/javascript',
            data: 'window.onload(function() {})'
          }
        }, function(err, rs) {
          done(err);
        });
      });
    });



    it('add', function(done) {
      var attachment = doc.attachment('plain.txt');
      attachment.attach('test content plain text', 'text/plain', function(err, body) {
        var d = doc.addAttachment('logo.png', null, 'image/png');
        if (!d)
          return done('Failed to create read stream');
        var s = fs.createReadStream(path.resolve(__dirname, './logo.png')).pipe(d);
        s.on('end', function() {
          done(err);
        });
      });
    });

    it('get', function(done) {
      doc.addAttachment('plain.txt', 'test content plain text', 'text/plain', function(err, body) {
        var plainTxt = doc.attachment('plain.txt');
        plainTxt.get(function(err, buffer) {
          assert(!err, 'Failed to get attachment');
          assert.equal(buffer.toString(), 'test content plain text');
          done(err);
        });
      });
    });

    it('delete', function(done) {
      doc.delAttachment('logo.png', function(err, body) {
        if (err) return done(err);
        doc.attachment('test.txt').del(function(err) {
          done(err);
        });
      });
    });
  });


  it('open', function(done) {
    var test = db.testdb.doc('test');
    test.open(function(err, doc) {
      if (err) return done(err);
      assert.equal(doc.name, 'not');
      test.open(test.rev(), function(err, doc) {
        assert.equal(test.rev(), doc._rev);
        db.testdb.doc({}).open(function(e) {
          assert.equal(e.message, 'docid must be provided');
          done(err);
        });
      });
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
    db.testdb.doc({}).destroy(function(err) {
      assert.equal(err.message, 'docid must be provided');
      db.testdb.doc({
        _id: 'test'
      }).destroy(function(err) {
        assert.equal(err.message, 'revision must be provided');

        var doc = db.testdb.doc({
          _id: 'person',
          name: 'john',
          age: 33
        });


        doc.create(function(err, rs) {
          if (err) return done(err);
          doc.del(function(err) {
            done(err);
          });
        });
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
    db.testdb.doc({}).head(function(err) {
      assert.equal(err.message, 'docid must be provided');
      var doc = db.testdb.doc('test');
      doc.head({
        revs: true,
        revs_info: true
      }, function(err, headers) {
        assert(headers);
        doc.open(function(err) {
          assert(doc.rev());
          doc.head({
            revs: true
          }, function(err, headers) {
            done(err);
          });
        });
      });
    });
  });


  it('exists', function(done) {
    db.testdb.doc('not_exists').exists(function(err, e) {
      if (err) return done(err);

      assert(!e);

      db.testdb.doc({
        name: 'john'
      }).exists(function(err, e) {
        assert.equal(err.message, 'docid must be provided');

        new Document('not exists db', 'id').exists(function(err, e) {
          assert(err);
          done();
        });
      });
    });
  });

  it('updateDoc', function() {
    var doc = db.testdb.doc({
      name: 'john',
      age: 25
    }).update({
      name: 'jack'
    });

    assert.equal(doc.doc.name, 'jack');
    assert.equal(doc.doc.age, 25);
  });


  it('save', function(done) {
    var doc = db.testdb.doc({
      name: 'alex',
      age: 24
    });

    doc.create(function(err, rs) {
      assert.equal(err, null, 'Fail to create document');
      doc.update({
        name: 'jack'
      }).save(function(err, rs) {
        assert.equal(err, null, 'Fail to save document');
        doc.open(function(err) {
          assert.equal(err, null, 'Fail to open document');
          assert.equal(doc.doc.name, 'jack');
          done(err);
        });
      });
    });
  });


  it('revisions', function(done) {
    db.testdb.doc('not_exists').revisions(function(err) {
      assert(err);
      db.testdb.doc('test').revisions(function(err, revs) {
        assert(revs);
        done(err);
      });
    });
  });

  it('create Document', function() {
    assert.throws(function() {
      new Document();
    }, 'Database url should not be empty');
  });

  it('new', function() {
    var doc = db.testdb.doc({
      _id: 'jack johns',
      name: 'jack'
    }).new();

    assert(!doc.id() && !doc._id);

    doc.new({
      _rev: '12afdsf',
      name: 'john'
    });

    assert.equal(doc.doc.name, 'john');
    assert(!doc.rev() && !doc._rev);

  });

});