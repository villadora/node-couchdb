var _ = require('underscore'),
    util = require('util'),
    RequestBase = require('./base');



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