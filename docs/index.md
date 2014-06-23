# Node Couchdb Client

There are already many couchdb client in npm, and some of them are great projects, like [nano](https://github.com/dscape/nano), [cradle](https://github.com/flatiron/cradle), but still not implements the couchdb features that satisfied my needs in auth, view operations and flexibility. Some libs has fewer apis and failed to meet needs. Even some are not complete yet or not friendly to use. 

There is always arguments that whether we really need a library for couchdb as it has rest apis. To me, if I'm working on a small project that read/write some documents from couchdb, I'm happy to work with http request lib like [request](mikeal/request). 

But when your applications heavily depends on couch, you may want something that make code better orgnized rather than concating url strings in everywhere.

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [APIs](apis.md)
- [License](#license)

## Features

* Extendable via bind, to build your own apis
* Support view, lists and shows
* Chain for query paramters, easy and clean
* All the concepts (View, Document, etc.) are seperated, which make this lib support urls that get rewritted
* Treat DesignDoc the same as Document, you can do operations on DesignDoc
* Support Https, via request


## Installation

    npm install couch-db --save

## Usage

#### Create a couch server

``` js
var couch = require('couch-db'),
    server = couch('http://localhost:5984');
/// or 
server = couch('https://localhost:6984', {
    rejectUnauthorized: false // this will pass to request
});
```

Or

``` js
var CouchDB = require('couch-db').CouchDB;
    server = new CouchDB('http://localhost:5984');
```

#### Authenticate with username && password

``` js
server.auth(username, password);
```

#### Or you can utilize the session by login

``` js
server.login(username, password, function(err) {
    // do admin ops
    ....
    server.logout(function(err) {
        // final work
    });
});
```

#### Get a database

``` js
var db = server.database('couch');
```

Or using bind:

``` js
server.bind('couch');
var db = server.couch;

// destroy
server.unbind('couch');
```

#### You can extend database

``` js
db.extend({
   // read documents by page
   page: function(n, limit, callback) {
       // Don't use skip/limit do page on views, see http://docs.couchdb.org/en/1.5.x/couchapp/views/pagination.html#views-pagination
       return this.select().skip((n-1)*limit).limit(limit|| this.defaultLimit).exec(callback);
   },
   defaultLimit: 20
});


db.page(1, 20, function(err, rows) {
    // get page items
});
```


#### Create database and insert new doc

``` js
var server = require('couch-db')('http://localhost:5984');

var db = server.database('test');
db.destroy(function(err) {
    // create a new database
    db.create(function(err) {
        // insert a document with id 'jack johns'
        db.insert({ _id: 'jack johns', name: 'jack' }, function(err, body) {
            if (err) {
                console.log('insertion failed ', err.message);
                return;
            }
            console.log(body);
            // body will like following:
            //   { ok: true,
            //     id: 'jack johns',
            //     rev: '1-610953b93b8bf1bae12427e2de181307' }
        });
    });
});
```

### create new document with attachments

``` javascript
// new document
var doc = db.testdb.doc({});
doc.attach([{
    name: 'place.css',
    content_type: 'text/css',
    data: 'body { font-size: 12px; }'
}, {
    name: 'script.js',
    content_type: 'script/javascript',
    data: 'window.onload(function() {})'
}]).create(function(err) {

});

```

### add/retrieve/update attachment

```javascript
// existing document
var doc = db.testdb.doc({
    _id: 'docid'
});

// open to get revision or assign revision to the document
doc.open(function(err) {
    doc.attach('plain.css', 'body { font-size:12pt; }', 'text/css');
    // save the doc
    doc.save(function(err, rs) {
        var plain = doc.attachment('plain.txt');
        // retrieve attachment
        plain.get(function(err, body) {
            assert.equal(body, 'body { font-size:12pt; }');
            // update
            plain.update('body { font-size:14pt; }', 'text/css', function(err) {
                plain.get(function(err, body) {
                    assert.equal(body, 'body { font-size:14pt; }');
                });
            });
        });
    });
});
```

### add attachments with pipe

```javascript
var d = doc.addAttachment('logo.png', null, 'image/png');
if (!d) assert.fail('Failed to create connect stream');
var s = fs.createReadStream(path.resolve(__dirname, './logo.png')).pipe(d);
s.on('end', function() {});
```

## APIs

See details in [here](apis.md)


## License

(The BSD License)

    Copyright (c) 2014, Villa.Gao <jky239@gmail.com>;
    All rights reserved.
