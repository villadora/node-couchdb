# CouchDB

## new CouchDB(url, [options])

* url {string} couchdb address
* options {object=} 

```js
var CouchDB = require('couch-db').CouchDB;
var couch = new CouchDb(url, options); 
```

## couch.config([opts])

Get a Config instance to view/change db configurations

* opts {object=}

```js
var config = couch.config();
```

## couch.database(dbname, [opts])

Get a Database instance from current couch with name as _dbname_

* dbname {string}
* opts {object=}


```js
var db = couch.database('testdb');
```

## couch.bind(dbname, [opts])

## couch.unbind(dbname)

## couch.existsDb(dbname, callback)

Test whether a database is existed, only available for couchdb >= 1.5.

## couch.allDbs(callback)

## couch.allDesignDocs(callback)

## couch.auth(username, password)

## couch.login(username, password, callback)

Use session login.

## couch.logout(callback)

Do logout.

## couch.session(callback)

Return current session information.

## couch.info(callback)


Get basic information about the couch server.

## couch.stats(statisticId, callback)

Return statistic information.

## couch.newUuids(n, callback)

Return _n_ uuids.
