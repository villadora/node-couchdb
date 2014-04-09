var CouchDB = require('./couch');

module.exports = function(url, options) {
    return new CouchDB(url, options);
};

module.exports.CouchDB = CouchDB;
module.exports.Database = require('./db');
module.exports.View = require('./view');
module.exports.Document = require('./doc');
module.exports.DesignDoc = require('./ddoc');