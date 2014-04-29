# Node Couchdb Client

[![Build Status](https://travis-ci.org/villadora/node-couchdb.png)](https://travis-ci.org/villadora/node-couchdb)

There are already many couchdb client in npm, and some of them are great project, but still not implements the couchdb features that satisfied my needs in auth and flexibility, and not updated for one year. Some other libs has fewer apis and failed to meet needs. Even some are not complete yet or not freindly to use. 

When you just want to get/save docs into couchdb, you may just need a simple http request lib like [request](mikeal/request). But when your application heavely depends on couch, you may want something that make code better orgnized rather than concating query strings in everywhere.


- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [APIs](#apis)


## Features

* Extendable via bind, to format your own apis
* Supports view, list and shows
* Chain for query paramters, easy and clean
* All the concepts (View, Document, etc.) are seperated, which make this lib support urls that get rewritted
* Treats DesignDoc the same as Document, you can do operations on DesignDoc

## Installation

    npm install couch-db --save

## Usage

Create a couch server:

``` js
var couch = require('couch-db'),
    server = couch('http://localhost:5984');
```

Or

``` js
var CouchDB = require('couch-db').CouchDB;
    server = new CouchDB('http://localhost:5984');
```

You can pass username && password to _auth()_ make authentication:

``` js
server.auth(username, password);
```

Or you can utilize the session by login:

``` js
server.login(username, password, function(err) {
    // do admin ops
    ....
    server.logout(function(err) {
        // final work
    });
});


Get a database:

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

You can extend database:

``` js
db.bind({
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


Create database and insert new doc

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

### Server


## Database


## Document


## Config



## License

(The BSD License)

    Copyright (c) 2014, Villa.Gao <jky239@gmail.com>;
    All rights reserved.
