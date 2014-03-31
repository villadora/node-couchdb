var _ = require('underscore'),
    util = require('util'),
    Executor = require('./exec'),
    RequestBase = require('./base'),
    encodeOptions = RequestBase.encodeOptions;


function View(ddUrl, viewName, options) {
    RequestBase.call(this, options);
    this.url = ddUrl + '/_view/' + viewName;
    this.viewName = viewName;
}

util.inherits(View, RequestBase);

_.extend(View.prototype, {
    get: function(id, callback) {
        this.query().setIncludeDocs(true).setKey(id).execute(callback);
    },
    mget: function(ids, callback) {
        this.query().setIncludeDocs(true).setKeys(ids).execute(callback);
    },
    /**
     *
     */
    query: function(options) {
        var self = this,
            // use additions to extend properties for future or higher version couchdb
            executor = new Executor(View.prototype.query.additions, 'conflicts', 'skip', 'limit', 'descending', 'endkey', 'starkey', 'endkey_docid', 'startkey_docid',
                'group', 'group_level', 'include_docs', 'inclusive_end', 'key', 'keys', 'reduce', 'stale', 'update_seq');

        executor.betweenDocIds = function(startid, endid) {
            this.options.startkey_docid = startid;
            this.options.endkey_docid = endid;
        };

        executor.betweenKeys = function(starkey, endkey) {
            this.options.startkey = startkey;
            this.options.endkey = endkey;
        };

        executor.execute = function(callback) {
            if (this.options.keys && this.options.keys.length) {
                self._post(self.url + '?' + encodeOptions(this.optiosn), {
                    body: JSON.stringify({
                        keys: this.options.keys
                    })
                }, function(err, body) {
                    if (err) return callback(err);
                    callback(err, body.rows, body.total_rows, body.offset, body);
                });

            } else {
                self._get(self.url + '?' + encodeOptions(this.options), function(err, body) {
                    if (err) return callback(err);
                    callback(err, body.rows, body.total_rows, body.offset, body);
                });
            }
        };

        if (options) {
            if (typeof options == 'function') {
                executor.exec(options);
            } else
                executor.set(options);
        }

        return executor;
    }
});


module.exports = View;