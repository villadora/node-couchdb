# Database


## new Database(url, [options]) {

* url {string} database url, a rewrited url can be provided
* options {Object=} request options will be used for this database


## design(designName, [options])

* designName {string} name of design document
* options {Object=} request options will be used for this database

### designDoc(designName, [options])

Alias for `design`.

## newUuids

The same as `newUuids` in [CouchDB](couchdb.md). Only be available when the database is created from a CouchDB instance.

## allDesignDocs(callback)

Get all design documents in this database.

## exists(callback)

Tell whether the database exists. Works after couchdb 1.5.

## info(callback)

Get information about this database.

## create(callback)

Create database.

## destroy(callback)

Delete this database.

## purge(callback)

Do `purge` on current database.

## allDocs([skip, limit, options], callback)

Get documents from database.

* skip {number=} number of document will be skipped from beginning
* limit {number=} number of document will be returned
* options {Object=} options available for `_all_docs` api


## searchByKeys([starkey, endkey]|[keys], [options], callback)

Search document by keys. A range with [startkey, endkey] can be provided, or an array of `keys` can be specified.

* startkey {string=} startkey
* endkey {string=} endkey
* keys {Array} keys that used for query
* options {Object=} options available for `_all_docs` api

## searchByIds(startId, endId, [options], callback)

Search document by Ids.

* startId {string}
* endId {string}
* options {Object=} options available for `_all_docs` api


## select([options])

Create a query executor, which can start a query later.

### query.skip(skip)

### query.limit(limit)

### query.betweenKeys(startKey, endKey)


### query.descending(value)

* value {boolean}

### exec(callback)

Execute the query

```javscript
db.select().limit(10).descending(true).betweenKeys(startKey, endKey).exec(function(err, rs) {
  
});
```

## doc(doc, [options])

* options {Object=} request options will be used for this database

## insert(doc, [options, callback])


## save(docid, doc, [options], callback)


## bulkSave(docs, [options], callback)



## fetch(id, callback)

* id {string} document id

## mfetch(ids, callback)

* ids {Array.<string>} documents' ids

## tempView(mapFn, reduceFn, [options], callback)

