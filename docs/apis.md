# APIs for couch-db

``` javascript
var couch = require('couch-db');
```

### About Options

Most of classes in this lib is accept an option object to let you configure the behaviors that how to request to the server.

All the options that you can pass to [request](mikeal/request), you can set here. So you can control whether use _strictSSL_, _proxy_ yourself.

Is there any other additional options that is used by [couch-db][villadora/node-couchdb)?

None except one: _request_. The request options is let user to take full control of how to send request to the server, and of course, you have to follow the _request_ api. Via this options, you can do cache layer to reduce request via modules like [modified](kaelzhang/node-modified), or even intercept the response.

So except the _request_ field, you can treat the options is the same as options in [request](https://github.com/mikeal/request).

You can go and see the doc [there](https://github.com/mikeal/request).



* [CouchDB](couchdb.md)
* [Database](database.md)
* [Config](config.md)
* [DesignDoc](ddoc.md)
* [Document](doc.md)
* [View](view.md)
