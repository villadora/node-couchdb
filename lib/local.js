var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base'),
    encodeOptions = RequestBase.encodeOptions;


function Local(dburl, options) {
    RequestBase.call(this, options);
}

util.inherits(Local, RequestBase);

// TODO:
_.extend(Local.prototype, {
    get: function() {

    },
    update: function() {

    },
    delete: function() {

    },
    copy: function() {

    }
});

module.exports = Local;