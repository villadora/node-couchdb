# View

## new View(ddocurl, name, [options])

* ddocurl {string} designdoc's url or some url after rewrited
* name {string} the name of view
* options {object=} 

```js
var View = require('couch-db').View;
var view = new View(ddocurl, viewname, options); 
```

```js
var view = server.database('somedb').ddoc('app').view('myview');
// or 
var view = server.database('somedb').view('app/myview');
```

## view.query([opts])

Start a query process in the view

* opts {string} the name of view

```js
var query = view.query();
query.skip(100).key('mykey').exec(function(err, results) {
  
});
```

## view.fetch(key, callback)

Query the view with a single key


## view.mfetch(keys, callback)

Query the view with a single key