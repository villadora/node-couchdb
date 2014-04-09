var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base');

function Config(url, options) {
    RequestBase.call(this, options);
    this.configUrl = url.replace(/\/$/, '') + '/_config';
}

util.inherits(Config, RequestBase);

_.extend(Config.prototype, {
    all: function(callback) {
        this._get(this.configUrl, function(err, cfgs) {
            callback(err, cfgs);
        });
    },
    section: function(section) {
        var self = this;
        return {
            get: self.get.bind(self, section),
            set: self.set.bind(self, section),
            del: self.del.bind(self, section)
        };
    },
    get: function(section, key, callback) {
        this._get([this.configUrl, section, key].join('/'), function(err, val) {
            if (err && err.statusCode == 404) {
                // if the config key is not found, return undefined
                return callback(null, undefined);
            }
            callback(err, val);
        });
    },
    set: function(section, key, val, callback) {
        this._put([this.configUrl, section, key].join('/'), {
            body: JSON.stringify(val)
        }, function(err, oldVal) {
            callback(err, oldVal);
        });
    },
    del: function(section, key, callback) {
        this._delete([this.configUrl, section, key].join('/'), function(err, oldVal) {
            callback(err, oldVal);
        });
    }
});



module.exports = Config;