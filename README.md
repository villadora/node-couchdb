# Node Couchdb Client - Couche

[![Build Status](https://travis-ci.org/villadora/node-couchdb.png)](https://travis-ci.org/villadora/node-couchdb)

There are already many couchdb client in npm, and some of them are great project, but still not implements all the couchdb features that satisfied my needs in auth and flexibility, and not updated for one year. Some other libs has fewer apis and failed to meet needs. Even some are not complete yet or not freindly to use. 

- [Installation](#installation)
- [Usage](#usage)
- [APIs](#apis)

## Installation

    npm install couche --save

## Usage

Create a couch server:

``` js
var couche = require('couche'),
    server = couche('http://localhost:5984');
```

Or

``` js
var CouchDB = require('couche').CouchDB;
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
var db = server.database('couche');
```

Or using bind:

``` js
server.bind('couche');
var db = server.couche;

// destroy
server.unbind('couche');
```

You can extend database:

``` js
db.bind({
   // read documents by page
   page: function(n, limit, callback) {
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
var server = require('couche')('http://localhost:5984');

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

## Server


## Database


## Document


## Config



## License

(The BSD License)

    Copyright (c) 2014, Villa.Gao <jky239@gmail.com>;
    All rights reserved.
