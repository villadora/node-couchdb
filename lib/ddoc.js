var _ = require('underscore'),
    assert = require('assert'),
    qs = require('querystring'),
    util = require('util');

var Document = require('./doc');
var View = require('./view');
var List = require('./list');
var Show = require('./show');

function DesignDoc(dburl, name, options) {
    Document.call(this, dburl, '_design/' + name, options);
    this.designName = name;

}

util.inherits(DesignDoc, Document);

_.extend(DesignDoc.prototype, {
    _encodeId: function() {
        return this._id;
    },
    info: function(callback) {
        this._get(this.dburl + '/' + this._id + '/_info', function(err, body) {
            callback(err, body);
        });
    },
    create: function(batch, callback) {
        var self = this;
        if (typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        self._put(this.dburl + '/' + this._id + (batch ? ("?" + qs.stringify({
            batch: 'ok'
        })) : ''), {
            body: JSON.stringify(this.doc, fnTrans)
        }, function(err, result) {
            if (err) return (callback && callback(err));
            self.id(result.id);
            self.rev(result.rev);
            delete this.deleted;
            callback && callback(null, result);
        });
    },
    save: function(batch, callback) {
        var self = this;
        if (arguments.length == 1 && typeof batch == 'function') {
            callback = batch;
            batch = undefined;
        }

        var options = {};
        batch && (options.batch = 'ok');
        this._rev && (options.rev = this._rev);

        self._put(this.dburl + '/' + this._id + '?' + qs.stringify(options), {
            body: JSON.stringify(self.doc, fnTrans)
        }, function(err, result) {
            if (err) return (callback && callback(err));
            self.rev(result.rev);
            callback && callback(err, result);
        });
    },
    view: function(viewname, options) {
        return new View(this.dburl + '/' + this._id + '/_view/' + viewname, viewname, options || this.options);
    },
    show: function(showname, options) {
        return new Show(this.dburl + '/' + this._id + '/_show/' + showname, showname, options || this.options);
    },
    list: function(listname, options) {
        return new List(this.dburl + '/' + this._id + '/_list/' + listname, listname, options);
    },
    update: function(updatename) {
        var self = this;
        return {
            get: function(options, callback) {
                if (arguments.length == 1 && typeof options == 'function') {
                    callback = options;
                    options = undefined;
                }

                self.enableJson = false;
                var rs = self._put(self.dburl + '/' + self._id + '/_update/' + updatename,
                    _.extend({}, options), callback);
                self.enableJson = true;
                return rs;
            },
            doc: function(docId, options, callback) {
                if (arguments.length == 2 && typeof options == 'function') {
                    callback = options;
                    options = undefined;
                }

                self.enableJson = false;
                var rs = self._post(self.dburl + '/' + self._id + '/_update/' + updatename + '/' + encodeURIComponent(docId),
                    _.extend({}, options), callback);
                self.enableJson = true;
                return rs;
            }
        };
    }
});

module.exports = DesignDoc;



function fnTrans(key, value) {
    if (typeof value == 'function')
        return '(' + value.toString() + ')';
    return value;
}