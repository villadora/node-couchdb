# Node Couchdb Client [![NPM version](https://badge.fury.io/js/couch-db.svg)](http://badge.fury.io/js/couch-db) [![Build Status](https://travis-ci.org/villadora/node-couchdb.png)](https://travis-ci.org/villadora/node-couchdb)  [![Coverage Status](https://coveralls.io/repos/villadora/node-couchdb/badge.png)](https://coveralls.io/r/villadora/node-couchdb)

There are already many couchdb client in npm, and some of them are great projects, like [nano](https://github.com/dscape/nano), [cradle](https://github.com/flatiron/cradle), but still not implements the couchdb features that satisfied my needs in auth, view operations and flexibility. Some libs has fewer apis and failed to meet needs. Even some are not complete yet or not friendly to use. 

There is always arguments that whether we really need a library for couchdb as it has rest apis. To me, if I'm working on a small project that read/write some documents from couchdb, I'm happy to work with http request lib like [request](mikeal/request). 

But when your applications heavily depends on couch, you may want something that make code better orgnized rather than concating url strings in everywhere.

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [APIs](#apis)
   - [CouchDB](#couchdb)
   - [Database](#database)
- [License](#license)

## Features

* Extendable via bind, to build your own apis
* Support view, lists and shows
* Chain for query paramters, easy and clean
* All the concepts (View, Document, etc.) are seperated, which make this lib support urls that get rewritted
* Treat DesignDoc the same as Document, you can do operations on DesignDoc
* Support Https


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

## APIs

### Options

Most of classes in this lib is accept an option object to let you configure the behaviors that how to request to the server.

All the options that you can pass to [request](mikeal/request), you can set here. So you can control whether use _strictSSL_, _proxy_ yourself.

Is there any other additional options that is used by [couch-db][villadora/node-couchdb)?

None except one: _request_. The request options is let user to take full control of how to send request to the server, and of course, you have to follow the _request_ api. Via this options, you can do cache layer to reduce request via modules like [modified](kaelzhang/node-modified), or even intercept the response.

So except the _request_ field, you can treat the options is the same as options in [request](https://github.com/mikeal/request).

You can go and see the doc [there](https://github.com/mikeal/request).

### CouchDB

#### new CouchDB(url, [options])

* url {string} couchdb address
* options {object=} 

```js
var CouchDB = require('couch-db').CouchDB;
var couch = new CouchDb(url, options); 
```

#### couch.config([opts])

Get a Config instance to view/change db configurations

* opts {object=}

```js
var config = couch.config();
```

#### couch.database(dbname, [opts])

Get a Database instance from current couch with name as _dbname_

* dbname {string}
* opts {object=}


```js
var db = couch.database('testdb');
```

#### couch.bind(dbname, [opts])

#### couch.unbind(dbname)

#### couch.existsDb(dbname, callback)

Test whether a database is existed, only available for couchdb >= 1.5.

#### couch.allDbs(callback)

#### couch.allDesignDocs(callback)

#### couch.auth(username, password)

#### couch.login(username, password, callback)

Use session login.

#### couch.logout(callback)

Do logout.

#### couch.session(callback)

Return current session information.

#### couch.info(callback)


Get basic information about the couch server.

#### couch.stats(statisticId, callback)

Return statistic information.

#### couch.newUuids(n, callback)

Return _n_ uuids.




### Config


### Database

#### db.tempView


### Document






## License

(The BSD License)

    Copyright (c) 2014, Villa.Gao <jky239@gmail.com>;
    All rights reserved.
