var _ = require('underscore'),
    util = require('util'),
    qs = require('querystring'),
    Executor = require('./exec'),
    RequestBase = require('./base');


function View(url, viewName, options) {
    RequestBase.call(this, options);
    this.url = url.replace(/\/$/, '');
    this.viewName = viewName;
}

util.inherits(View, RequestBase);

_.extend(View.prototype, {
    fetch: function(id, callback) {
        this.query().setIncludeDocs(true).setKey(id).execute(callback);
    },
    mfetch: function(ids, callback) {
        this.query().setIncludeDocs(true).setKeys(ids).execute(callback);
    },
    /**
     *
     */
    query: function(options) {
        var self = this,
            // use additions to extend properties for future or higher version couchdb
            executor = new Executor(View.prototype.query.additions, 'conflicts', 'skip', 'limit', 'descending', 'endkey', 'startkey', 'endkey_docid', 'startkey_docid',
                'group', 'group_level', 'include_docs', 'inclusive_end', 'key', 'keys', 'reduce', 'stale', 'update_seq');

        executor.betweenIds = function(startid, endid) {
            this.options.startkey_docid = startid;
            this.options.endkey_docid = endid;
        };

        executor.betweenKeys = function(starkey, endkey) {
            this.options.startkey = startkey;
            this.options.endkey = endkey;
        };

        executor.execute = function(callback) {
            var opts = _.clone(this.options);

            try {
                ['startkey', 'endkey', 'key'].forEach(function(p) {
                    opts[p] && (opts[p] = JSON.stringify(opts[p]));
                });
            } catch (e) {
                return (callback && callback(e));
            }


            if (opts.keys && opts.keys.length) {
                var keys = opts.keys;
                delete opts.keys;
                self._post(self.url + '?' + qs.stringify(opts), {
                    body: JSON.stringify({
                        keys: keys
                    })
                }, function(err, body) {
                    if (err) return (callback && callback(err));
                    callback && callback(err, body.rows, body.total_rows, body.offset, body);
                });

            } else {
                self._get(self.url + '?' + qs.stringify(opts), function(err, body) {
                    if (err) return (callback && callback(err));
                    callback && callback(err, body.rows, body.total_rows, body.offset, body);
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