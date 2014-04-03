var _ = require('underscore');

function capital(str) {
    if (str)
        return str.charAt(0).toUpperCase() + str.slice(1);
    return '';
}

function Executor() {
    var self = this;
    this.options = {};

    Array.prototype.forEach.call(arguments, function(prop) {
        addProperty(prop);
    });

    function addProperty(prop) {
        if (prop instanceof Array) {
            prop.forEach(addProperty);
        } else if (typeof prop == 'string') {
            var method = prop.split('_').map(function(val, idx) {
                if (idx === 0)
                    return val;
                return capital(val);
            }).join('');
            if (!self[method]) {
                self[method] = function(val) {
                    /* jshint eqnull: true */
                    if (val != null)
                        self.options[prop] = val;
                    return this;
                };
            }
        }
    }
}


Executor.prototype.set = function(options) {
    if (options)
        this.options = _.extend(this.options, options);

    return this;
};


Executor.prototype.exec = function() {
    return this.execute.apply(this, arguments);
};

Executor.prototype.execute = function() {};

module.exports = Executor;