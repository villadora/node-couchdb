var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base');

module.exports = List;

function List(url, listName, options) {
    RequestBase.call(this, options);
    this.url = url.replace(/\/$/, '');
    this.listName = listName;
}

util.inherits(List, RequestBase);

List.prototype.view = function(viewname, options, callback) {
    if (arguments.length == 2 && typeof options == 'function') {
        callback = options;
        options = undefined;
    }
    options = options || {};
    options.method = options.method || 'GET';

    this.enableJson = false;
    var rs = this._request(this.url + '/' + viewname, options, callback);
    this.enableJson = true;
    return rs;
};