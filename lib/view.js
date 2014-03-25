var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base');

var builtinReduces = ['_count', '_sum'];

function View(url, design, view, options) {
    RequestBase.call(url, options);
    this.url = url;
    this.design = design;
    this.view = view;
}

util.inherits(View, RequestBase);

_.extend(View.prototype, {

});


module.exports = View;