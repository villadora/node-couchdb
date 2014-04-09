module.exports = {
  "language": "javascript",
  "views": {
    "all": {
      "map": "function(doc) { if(doc.type == 'article') { emit(null, doc); }  }"
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
      provides("html", function() {
        return '<p>' + doc.body + '</p>';
      });
    }
  },
  lists: {
    short: function(head, req) {
      while (row = getRow()) {
        if (!row.id) continue;
        out[row.id] = true;
      }
      send(toJSON(Object.keys(out)));
    }
  }
};