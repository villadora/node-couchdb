var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  semver = require('semver'),
  couchdb = require('../lib'),
  config = require('./test-config'),
  CouchDB = couchdb.CouchDB;

describe.skip('https', function() {
  /*
    this.timeout(3000);
    var db;
    before(function() {
        db = new CouchDB(config.url, {
            strictSSL: false
        });
    });

    it('login', function(done) {
        db.login('admin', 'admin', function(err, body) {
            console.log(body);
            done(err);
        });
    });
*/
});