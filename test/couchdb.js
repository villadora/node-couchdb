var assert = require('chai').assert,
    url_module = require('url'),
    path = require('path'),
    couchdb = require('../lib'),
    config = require('./config'),
    CouchDB = couchdb.CouchDB;


describe('couchdb', function() {
    this.timeout(30000);

    var db;

    before(function() {
        // db = new CouchDB('http://isaacs.iriscouch.com/');
        db = new CouchDB(config.url);
        db.auth(config.user, config.pass);

        var cacheMapper = function cachePathMapper(options, callback) {
            // no cache by default
            var url = url_module.parse(options.url || options.uri),
                regexp = /^\/registry\/([a-z-]+)/,
                mc = regexp.exec(url.pathname),
                filePath = null;

            if (mc && mc.length) {
                filePath = path.resolve(__dirname, '../.npm_cache/registry/' + mc[1] + '.json');
            }

            callback(null, filePath);
        };

    });


    describe('couchdb', function() {
        it('allDbs', function(done) {
            db.allDbs(function(err, dbs) {
                assert(dbs.length);
                done(err);
            });
        });
        it('stats', function(done) {
            db.stats(function(err, stat) {
                assert(stat);
                done(err);
            });
        });

        it('version', function(done) {
            db.version(function(err, version) {
                assert(version.version && version.uuid);
                done(err);
            });
        });

        it('allDesignDocs', function(done) {
            db.allDesignDocs(function(err, ddocs) {
                assert(ddocs);
                done(err);
            });
        });
    });

    describe.skip('dbs', function() {
        // require authorize
        it('query', function(done) {
            db.registry.query(function(doc) {
                    if (!doc || doc.deprecated) return;
                    if (doc._id.match(/^npm-test-.+$/) &&
                        doc.maintainers &&
                        doc.maintainers[0].name === 'isaacs')
                        return;
                    var l = doc['dist-tags'] && doc['dist-tags'].latest;
                    if (!l) return;
                    l = doc.versions && doc.versions[l];
                    if (!l) return;
                    var desc = doc.description || l.description || '';
                    var readme = doc.readme || l.readme || '';
                    var d = l.dependencies;
                    if (!d) return;
                    for (var dep in d) {
                        emit([dep, doc._id, desc, readme], 1);
                    }
                }, '_sum',
                function(err, docs) {
                    console.log(err, docs);
                    done(err);
                });
        });


        it('view', function(done) {
            db.registry.view('app/dependedUpon', {
                start_key: '',
                end_key: 'a',
                group_level: 1
            }, function(err, doc) {
                console.log(err, doc);
                done(err);
            });
        });

        it('info', function(done) {
            db.registry.info(function(err, info) {
                done(err);
            });
        });

        it('allDocs', function(done) {
            db.registry.allDocs('0', '1', function(err, docs, total, offset) {
                done(err);
            });
        });

        it('designDocs', function(done) {
            db.registry.designDocs(function(err, ddocs) {
                assert(ddocs.length);
                done(err);
            });
        });

        it('docHead', function(done) {
            db.registry.docHead('not', function(err, res) {
                done(err);
            });
        });

        it('open', function(done) {
            db.registry.open('not', function(err, doc) {
                done(err);
            });
        });
    });
});