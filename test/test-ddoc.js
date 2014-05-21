module.exports = {
  "language": "javascript",
  "updates": {
    change: function(doc, req) {
      if (!doc)
        return [null, {
          'code': 404,
          'json': {
            'error': 'missed',
            'reason': 'no document to update'
          }
        }];
      doc.viewed = new Date().toISOString();
      return [doc, JSON.stringify({
        ok: "updated"
      })];
    }
  },
  "views": {
    "all": {
      "map": "function(doc) { if(doc.type == 'article') { emit(doc._id, doc); }  }"
    },
    "by_author_id": {
      map: function(doc) {
        if (doc.type == 'article') {
          emit([doc.author_id], doc);
        }
      }
    },
    "by_status": {
      map: function(doc) {
        if (doc.type == 'article') {
          emit([doc.status], doc);
        }
      }
    },
    "titles": {
      map: function(doc) {
        if (doc.type == 'article') {
          emit(null, {
            'id': doc._id,
            'title': doc.title
          });
        }
      }
    },
    "norevs": {
      map: function(doc) {
        if (doc.type == 'article' && doc._revisions && doc._revisions.ids.length === 1) {
          // we have a problem
          emit(doc._id, 1);
        }
      },
      reduce: "_sum"
    }
  },
  shows: {
    content: function(doc, req) {
      if (doc)
        provides("html", function() {
          return '<p>' + doc.body + '</p>';
        });
      else provides("html", function() {
        return "<p>No document is provided</p>";
      });
    }
  },
  lists: {
    short: function(head, req) {
      var out = {};
      while (row = getRow()) {
        if (!row.id) continue;
        out[row.id] = true;
      }
      send(toJSON(Object.keys(out)));
    }
  }
};