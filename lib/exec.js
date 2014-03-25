function capital(str) {
    if (str)
        return str.charAt(0).toUpperCase() + str.slice(1);
    return '';
}

function Executor() {
    var self = this;
    this.options = {};
    Array.prototype.forEach.call(arguments, function(prop) {
        if (prop) {
            self['set' + prop.split('_').map(capital).join('')] = function(val) {
                self.options[prop] = val;
                return this;
            };
        }
    });
}



Executor.prototype.execute = function() {};

module.exports = Executor;