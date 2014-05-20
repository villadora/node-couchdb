var couchdb = require('../lib'),
  config = require('./test-config'),
  CouchDB = couchdb.CouchDB;

describe('Local', function() {
  it('constructor', function() {
    var l = new CouchDB(config.url).database('testdb').local();
  });
});