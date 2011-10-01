(function() {
  window.Fixtures = {};
  Fixtures.BackboneSyncResponse = {};
  Fixtures.testSync = function(httpMethod, model, options) {
    return options.success(Fixtures.BackboneSyncResponse, 200, null);
  };
  Fixtures.Post = Knockback.Model.extend({
    observables: {
      name: "",
      tags: [],
      meta: {}
    },
    relations: {
      author: 'Fixtures.Author',
      comments: 'Fixtures.CommentsCollection'
    }
  });
  Fixtures.Post.prototype.sync = Fixtures.testSync;
  Fixtures.PostsCollection = Backbone.Collection.extend({
    model: Fixtures.Post
  });
  Fixtures.Author = Knockback.Model.extend({
    observables: {
      name: ""
    },
    relations: {
      posts: 'Fixtures.PostsCollection'
    }
  });
  Fixtures.Comment = Knockback.Model.extend({
    observables: {
      content: "",
      position: 0
    },
    relations: {
      post: 'Fixtures.Post'
    }
  });
  Fixtures.CommentsCollection = Backbone.Collection.extend({
    model: Fixtures.Comment
  });
  Fixtures.ProxyModel = Knockback.Model.extend({
    proxied: ['getThis', 'setThis'],
    setThis: function() {
      return window.thisValueForKnockbackModelProxyTest = this;
    },
    getThis: function() {
      return window.thisValueForKnockbackModelProxyTest;
    }
  });
  Fixtures.IgnoreProxyModel = Knockback.Model.extend({
    proxied: ['x', 'foo'],
    initialize: function(attrs, options) {
      this.x = 23;
      return Knockback.Model.prototype.initialize.apply(this, [attrs, options]);
    }
  });
}).call(this);
