# DesignDoc

## new DesignDoc(dburl, name, [options])

* dburl {string} database address
* name {string} design doc name
* options {object=} 

```js
var DesignDoc = require('couch-db').DesignDoc
var ddoc = new DesignDoc(url, dname, options); 
```

```js
var ddoc = server.database('somedb').ddoc('app');
```

## ddoc.view(viewname, [options])

Get a View instance in this design doc

* viewname {string} the name of view
* opts {object=}

```js
var view = ddoc.view('myview');
```
