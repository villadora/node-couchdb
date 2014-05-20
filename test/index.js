var assert = require('chai').assert,
  url_module = require('url'),
  path = require('path'),
  semver = require('semver'),
  couchdb = require('../lib'),
  config = require('./test-config');

describe('couchdb', function() {
  var db;

  it('create server', function(done) {
    couchdb(config.url).info(function(err, info) {
      assert(info);
      done(err);
    });
  });

});