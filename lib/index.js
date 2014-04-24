var CouchDB = require('./couch');

module.exports = function(url, options) {
    return new CouchDB(url, options);
};

module.exports.CouchDB = CouchDB;
module.exports.Database = require('./db');
module.exports.Document = require('./doc');
module.exports.DesignDoc = require('./ddoc');
module.exports.View = require('./view');
module.exports.List = require('./list');
module.exports.Show = require('./show');