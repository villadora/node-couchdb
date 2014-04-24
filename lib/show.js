var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base');

module.exports = Show;

function Show(url, showName, options) {
    RequestBase.call(this, options);
    this.url = url.replace(/\/$/, '');
    this.showName = showName;
}

util.inherits(Show, RequestBase);

Show.prototype.doc = function(docid, options, callback) {
    if (arguments.length == 2 && typeof options == 'function') {
        callback = options;
        options = undefined;
    }

    options = options || {};
    options.method = options.method || 'GET';

    this.enableJson = false;
    var rs = this._request(this.url + '/' + encodeURIComponent(docid), options, callback);
    this.enableJson = true;
    return rs;
};


Show.prototype.get = function(options, callback) {
    if (arguments.length == 1 && typeof options == 'function') {
        callback = options;
        options = undefined;
    }

    options = options || {};
    options.method = options.method || 'GET';

    this.enableJson = false;
    var rs = this._request(this.url, options, callback);
    this.enableJson = true;
    return rs;

};