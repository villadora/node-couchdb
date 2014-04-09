var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base');


function Local(dburl, options) {
    RequestBase.call(this, options);
}

util.inherits(Local, RequestBase);

// TODO:
_.extend(Local.prototype, {
    create: function() {

    },
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