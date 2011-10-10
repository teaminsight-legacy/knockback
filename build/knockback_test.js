(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
  Fixtures.PostsController = Knockback.Controller.extend({
    routes: {
      'blogs/:blog_id/posts': 'index',
      'blogs/:blog_id/posts/:id': 'show'
    },
    index: function(blog_id) {
      return this.lastAction = 'Posts#index';
    },
    show: function(blog_id, id) {
      return this.lastAction = 'Posts#show';
    }
  });
  Fixtures.EmptyFilters = Knockback.Controller.extend({
    routes: {
      'empty/foo/:id': 'foo'
    }
  });
  Fixtures.SingularFilters = Knockback.Controller.extend({
    routes: {
      'singular/foo/:id': 'foo'
    },
    filters: {
      before: 'before_all',
      after: 'after_all'
    },
    before_all: function() {},
    after_all: function() {}
  });
  Fixtures.PluralFilters = Knockback.Controller.extend({
    routes: {
      'plural/foo': 'foo'
    },
    filters: {
      before: ['a', 'b', 'c']
    },
    a: function() {},
    b: function() {},
    c: function() {}
  });
  Fixtures.ActionFilters = Knockback.Controller.extend({
    routes: {
      'action/foo/bar': 'foo_bar'
    },
    filters: {
      before_foo_bar: 'a',
      after_foo_bar: ['a', 'b', 'c']
    },
    a: function() {},
    b: function() {},
    c: function() {}
  });
  Fixtures.CombinedFilters = Knockback.Controller.extend({
    routes: {
      'combined/foo/bar': 'foo_bar'
    },
    filters: {
      before: ['before_all', 'a'],
      after: 'after_all',
      before_foo_bar: 'b',
      after_foo_bar: ['a', 'b', 'c']
    },
    initialize: function(options) {
      Knockback.Controller.prototype.initialize.apply(this, options);
      return this.filtersRan = {
        before: [],
        after: []
      };
    },
    foo_bar: function() {
      this.lastAction = 'Combined#foo_bar';
      return this.actionRan = true;
    },
    runFilter: function(name) {
      var beforeOrAfter;
      beforeOrAfter = this.actionRan ? 'after' : 'before';
      return this.filtersRan[beforeOrAfter].push(name);
    },
    before_all: function() {
      return this.runFilter('#before_all');
    },
    after_all: function() {
      return this.runFilter('#after_all');
    },
    a: function() {
      return this.runFilter('#a');
    },
    b: function() {
      return this.runFilter('#b');
    },
    c: function() {
      return this.runFilter('#c');
    }
  });
  Fixtures.ArgFilters = Knockback.Controller.extend({
    routes: {
      'arg/foo': 'foo'
    },
    filters: {
      before: 'before',
      after: 'after'
    },
    initialize: function(options) {
      Knockback.Controller.prototype.initialize.apply(this, options);
      return this.argumentsGiven = {
        before: [],
        after: []
      };
    },
    foo: function() {
      return 'foo';
    },
    before: function() {
      return this.argumentsGiven.before = Array.prototype.slice.call(arguments);
    },
    after: function() {
      return this.argumentsGiven.after = Array.prototype.slice.call(arguments);
    }
  });
  module('Knockback.Model', {
    setup: function() {
      this.modelClass = Knockback.Model;
      return this.model = new this.modelClass;
    }
  });
  test('is a backbone model', function() {
    var skipAttributes;
    skipAttributes = {
      _previousAttributes: true,
      _changed: true,
      ajaxPrefix: true,
      disableSync: true
    };
    return _.each(Backbone.Model.prototype, __bind(function(value, key) {
      if (skipAttributes[key]) {
        return;
      }
      ok(this.modelClass.prototype[key], "class prototype should have the '" + key + "' property");
      return ok(this.model[key], "instance should have the '" + key + "' property");
    }, this));
  });
  test('initializes attributes', function() {
    var attrs, m;
    attrs = {
      foo: 'foo',
      bar: 'bar'
    };
    m = new this.modelClass(attrs);
    equal(m.get('foo'), attrs.foo);
    return equal(m.get('bar'), attrs.bar);
  });
  test("'ID' is an observable for the idAttribute", function() {
    ok(this.model.ID, "should have an 'ID' property");
    return ok(this.model.ID.__ko_proto__, "'ID' property should be an observable");
  });
  test("ID returns null for default value", function() {
    return same(this.model.ID(), null);
  });
  test("ID is set during initialization", function() {
    var m;
    m = new this.modelClass({
      id: 7
    });
    return equal(m.ID(), 7);
  });
  test("ID is updated when the idAttribute is updated", function() {
    expect(3);
    this.model.ID.subscribe(function(newValue) {
      return equal(newValue, 42);
    });
    this.model.bind('change:id', function(model, newValue) {
      return equal(newValue, 42);
    });
    this.model.set({
      id: 42
    });
    return equal(this.model.ID(), 42);
  });
  test("set method returns 'this' model on success", function() {
    return same(this.model.set({
      foo: 'bar'
    }), this.model);
  });
  test("set method returns false on failure", function() {
    var M, m;
    M = Knockback.Model.extend({
      validate: function(attrs) {
        return 'invalid';
      }
    });
    m = new M;
    return same(m.set({
      foo: 'bar'
    }), false);
  });
  module('Knockback.Model: proxied methods', {
    setup: function() {
      return this.model = new Fixtures.ProxyModel;
    }
  });
  asyncTest("methods listed in proxied are bound to the model instance", function() {
    expect(1);
    setTimeout(this.model.setThis, 0);
    return setTimeout((__bind(function() {
      same(this.model.getThis(), this.model);
      return start();
    }, this)), 10);
  });
  test("non-methods listed in proxied are ignored", function() {
    try {
      new Fixtures.IgnoreProxyModel;
      return ok(true);
    } catch (err) {
      return ok(false, 'should ignore items in the proxied list that are not method names');
    }
  });
  test("backbone methods don't get bound to the knockout model if proxied list is empty", function() {
    var p;
    p = new Fixtures.Post;
    return same(p.save, Backbone.Model.prototype.save);
  });
  module("Knockback.Model: observable attributes");
  test('set to default values during initialization', function() {
    var p;
    p = new Fixtures.Post;
    equal(p.get('name'), "", "'name' should be \"\"");
    deepEqual(p.get('tags'), []);
    return deepEqual(p.get('meta'), {});
  });
  test('separate instances should have separate values for default attributes', function() {
    var p1, p2;
    p1 = new Fixtures.Post;
    p2 = new Fixtures.Post;
    p1.get('tags').push('foo');
    deepEqual(p1.get('tags'), ['foo']);
    deepEqual(p2.get('tags'), []);
    _.extend(p1.get('meta'), {
      foo: 'bar'
    });
    deepEqual(p1.get('meta'), {
      foo: 'bar'
    });
    return deepEqual(p2.get('meta'), {});
  });
  test('knockout observables created for non-array attributes', function() {
    var p;
    p = new Fixtures.Post;
    ok(p.name.__ko_proto__, "'name' should be observable");
    ok(!p.name.push, "'name' should not be an observableArray");
    ok(p.meta.__ko_proto__, "'meta' should be observable");
    return ok(!p.meta.push, "'meta' should not be an observableArray");
  });
  test('knockout observableArrays created for array attributes', function() {
    var p;
    p = new Fixtures.Post;
    ok(p.tags.__ko_proto__, "'tags' should be observable");
    return ok(p.tags.push, "'tags' should be an observableArray");
  });
  test('observables match attributes used for initialization', function() {
    var c;
    c = new Fixtures.Comment({
      content: 'foo',
      position: 3
    });
    equal(c.content(), 'foo');
    return equal(c.position(), 3);
  });
  test('throws an error if an observable attribute would overwrite an existing property', function() {
    var SomeModel;
    SomeModel = Knockback.Model.extend({
      observables: {
        save: 'foo'
      }
    });
    return raises(function() {
      return new SomeModel;
    });
  });
  test('throws an error if the id attribute is given as an observable', function() {
    var SomeModel;
    SomeModel = Knockback.Model.extend({
      observables: {
        id: 'foo'
      }
    });
    return raises(function() {
      return new SomeModel;
    });
  });
  module("Knockback.Model: unspecified attributes");
  test("observables should be created for unspecified attributes", function() {
    var p;
    p = new Fixtures.Post({
      foo: 'bar'
    });
    ok(p.foo, "'foo' property should exist");
    return equal(p.foo(), 'bar');
  });
  test("skip creating observable if unspecified attribute would overwrite another property", function() {
    var p;
    p = new Fixtures.Post({
      save: 'whales'
    });
    equal(p.save, Fixtures.Post.prototype.save);
    return equal(p.get('save'), 'whales');
  });
  module("Knockback.Model: attribute events", test("updates observable after attribute change", function() {
    var p;
    expect(2);
    p = new Fixtures.Post;
    p.name.subscribe(function(newValue) {
      return equal(newValue, 'foo');
    });
    p.set({
      name: 'foo'
    });
    return equal(p.name(), 'foo');
  }));
  test("updates attribute after observable change", function() {
    var p;
    expect(2);
    p = new Fixtures.Post;
    p.bind('change:name', function(model, newValue) {
      return equal(newValue, 'foo');
    });
    p.name('foo');
    return equal(p.get('name'), 'foo');
  });
  test("events only fire once after backbone model change", function() {
    var p;
    expect(2);
    p = new Fixtures.Post;
    p.bind('change:name', function() {
      return ok(true);
    });
    p.name.subscribe(function() {
      return ok(true);
    });
    return p.set({
      name: 'foo'
    });
  });
  test("events only fire once after observable change", function() {
    var p;
    expect(2);
    p = new Fixtures.Post;
    p.name.subscribe(function() {
      return ok(true);
    });
    p.bind('change:name', function() {
      return ok(true);
    });
    return p.name('foo');
  });
  module("Knockback.Model: relations");
  test("raise exception if relation model is not defined", function() {
    var SomeModel;
    SomeModel = Knockback.Model.extend({
      relations: {
        foo: 'Foo'
      }
    });
    return raises((function() {
      return new SomeModel;
    }), /class 'Foo' is not defined for the 'foo' relation/);
  });
  test('throws an error if a relation would overwrite an existing property', function() {
    var SomeModel;
    SomeModel = Knockback.Model.extend({
      relations: {
        set: 'Fixtures.Author'
      }
    });
    return raises(function() {
      return new SomeModel;
    });
  });
  module("Knockback.Model: belongsTo relation");
  test("create empty model for relation", function() {
    var p;
    p = new Fixtures.Post;
    equal(p.author.constructor.prototype, Fixtures.Author.prototype);
    return equal(p.author.name(), "");
  });
  test("creates an observable '_display' method", function() {
    var p;
    p = new Fixtures.Post;
    ok(p.author_display, "model should have 'author_display' property");
    ok(p.author_display.__ko_proto__, "'author_display' property should be an observable");
    return equal(p.author_display(), p.author);
  });
  test("initialize belongsTo relation with nested attributes", function() {
    var p;
    p = new Fixtures.Post({
      author: {
        name: 'Foo Bar'
      }
    });
    equal(p.author.name(), 'Foo Bar');
    return equal(p.author_display().name(), 'Foo Bar');
  });
  test("attribute change updates related model's attributes", function() {
    var p;
    expect(3);
    p = new Fixtures.Post;
    p.author.name.subscribe(function() {
      return ok(true);
    });
    p.author.bind('change:name', function() {
      return ok(true);
    });
    p.set({
      author: {
        name: 'Foo Bar'
      }
    });
    return equal(p.author.name(), 'Foo Bar');
  });
  module("Knockback.Model: hasMany relation", {
    setup: function() {
      this.post = new Fixtures.Post;
      return this.comments = [
        {
          content: 'foo',
          position: 0
        }, {
          content: 'bar',
          position: 0
        }
      ];
    }
  });
  test("relation method is a backbone collection", function() {
    ok(this.post.comments, "model should have a 'comments' property");
    ok(this.post.comments.models, "'comments' property should be a backbone collection");
    ok(this.post.comments.constructor.prototype, Fixtures.CommentsCollection.prototype);
    return deepEqual(this.post.comments.models, []);
  });
  test("creates an observableArray '_display' method", function() {
    ok(this.post.comments_display, "model should have a 'comments_display' property");
    ok(this.post.comments_display.__ko_proto__, "'comments_display' property should be an observable");
    ok(this.post.comments_display.push, "'comments_display' property should be an observableArray");
    return equal(this.post.comments_display(), this.post.comments.models);
  });
  test("initialize hasMany relation with nested array of attributes", function() {
    var p;
    p = new Fixtures.Post({
      comments: this.comments
    });
    deepEqual(_.pluck(p.comments.models, 'attributes'), this.comments);
    return deepEqual(_.pluck(p.comments_display(), 'attributes'), this.comments);
  });
  test("collection resets when attribute changes", function() {
    expect(3);
    this.post.bind('change:comments', function() {
      return ok(true);
    });
    this.post.comments.bind('reset', function() {
      return ok(true);
    });
    this.post.set({
      comments: this.comments
    });
    return deepEqual(_.pluck(this.post.comments.models, 'attributes'), this.comments);
  });
  test("knockout binding updates when collection is reset", function() {
    expect(3);
    this.post.comments.bind('reset', function() {
      return ok(true);
    });
    this.post.comments_display.subscribe(function() {
      return ok(true);
    });
    this.post.comments.reset(this.comments);
    return deepEqual(_.pluck(this.post.comments_display(), 'attributes'), this.comments);
  });
  test("knockout binding updates when an item is added to the collection", function() {
    expect(4);
    this.post.comments.bind('add', function() {
      return ok(true, "comments 'add' event was triggered");
    });
    this.post.comments_display.subscribe(function() {
      return ok(true, "comments_display 'subscribe' event was triggered");
    });
    this.post.comments.add(this.comments[0]);
    return deepEqual(_.pluck(this.post.comments_display(), 'attributes'), [this.comments[0]]);
  });
  test("knockout binding updates when an item is removed from the collection", function() {
    expect(3);
    this.post.comments.reset(this.comments);
    this.post.comments.bind('remove', function() {
      return ok(true, "comments 'remove' event was triggered");
    });
    this.post.comments_display.subscribe(function() {
      return ok(true, "comments_display 'subscribe' event was triggered");
    });
    this.post.comments.remove(this.post.comments.first());
    return deepEqual(_.pluck(this.post.comments_display(), 'attributes'), [this.comments[1]]);
  });
  test("knockout binding is sorted by position", function() {
    var commentsOrder, lastPosition, positionalComments;
    positionalComments = [
      {
        content: 'biz',
        position: 3
      }, {
        content: 'bar',
        position: 2
      }, {
        content: 'foo',
        position: 1
      }, {
        content: 'baz',
        position: 4
      }
    ];
    this.post.comments.add(positionalComments);
    commentsOrder = _.map(this.post.comments_display(), function(comment) {
      return comment.position();
    });
    lastPosition = -1;
    return _.each(this.post.comments_display(), __bind(function(comment) {
      ok(comment.position() > lastPosition, "comments_display() should display comments in order, but order was [" + commentsOrder + "]");
      return lastPosition = comment.position();
    }, this));
  });
  module('Knockback.Model: saving', {
    setup: function() {
      this.response = {
        post: {
          name: 'foo',
          tags: ['a', 'b', 'c']
        }
      };
      this.relations = {
        author: {
          name: 'Joe Test'
        },
        comments: [
          {
            content: 'foo'
          }
        ]
      };
      this.postClass = Fixtures.Post.extend({
        ajaxPrefix: 'post'
      });
      return this.post = new this.postClass;
    },
    teardown: function() {
      return Fixtures.BackboneSyncResponse = {};
    }
  });
  test("should return response unmodified if no ajax prefix is defined", function() {
    var attrs, p;
    p = new Fixtures.Post;
    attrs = p.parse(this.response.post);
    return deepEqual(attrs, this.response.post);
  });
  test("should extract attributes from response using ajax prefix", function() {
    var attrs;
    attrs = this.post.parse(this.response);
    return deepEqual(attrs, this.response.post);
  });
  test("should update associations after save", function() {
    this.response.post = _.extend(this.response.post, this.relations);
    Fixtures.BackboneSyncResponse = this.response;
    this.post.save();
    equal(this.post.author.name(), 'Joe Test');
    return deepEqual(this.post.comments.pluck('content'), ['foo']);
  });
  test("should look for relations in top level of response", function() {
    this.response = _.extend(this.response, this.relations);
    Fixtures.BackboneSyncResponse = this.response;
    this.post.save();
    equal(this.post.author.name(), 'Joe Test');
    return deepEqual(this.post.comments.pluck('content'), ['foo']);
  });
  test("should trigger events for model and relations after save", function() {
    var events;
    events = {
      'post/change': {
        expected: 2,
        actual: 0
      },
      'post/change:name': {
        expected: 1,
        actual: 0
      },
      'author/change': {
        expected: 1,
        actual: 0
      },
      'comments/add': {
        expected: 0,
        actual: 0
      },
      'comments/reset': {
        expected: 1,
        actual: 0
      }
    };
    this.post.bind('change', function() {
      return events['post/change'].actual += 1;
    });
    this.post.bind('change:name', function() {
      return events['post/change:name'].actual += 1;
    });
    this.post.author.bind('change', function() {
      return events['author/change'].actual += 1;
    });
    this.post.comments.bind('add', function() {
      return events['comments/add'].actual += 1;
    });
    this.post.comments.bind('reset', function() {
      return events['comments/reset'].actual += 1;
    });
    this.response = _.extend(this.response, this.relations);
    Fixtures.BackboneSyncResponse = this.response;
    this.post.save();
    return _.each(events, function(info, eventName) {
      return equal(info.actual, info.expected, "'" + eventName + "' event should be called once, but was called " + info.actual + " times");
    });
  });
  module("Knockback.Controller");
  test("has extend method", function() {
    ok(Knockback.Controller.extend, "FiltersController should have an 'extend' method");
    return ok(Fixtures.PostsController.extend, "Fixtures.PostsController should have an 'extend' method");
  });
  test("create", function() {
    new Fixtures.PostsController;
    return ok(true);
  });
  module("Knockback.Controller: initialization", {
    setup: function() {
      Backbone.history = new Backbone.History;
      Backbone.history.options = {
        root: '/'
      };
      this.controller = new Fixtures.PostsController;
      return this.inverseRoutes = {
        'index': '/^blogs/([^/]*)/posts$/',
        'show': '/^blogs/([^/]*)/posts/([^/]*)$/'
      };
    },
    teardown: function() {
      return delete Backbone.history;
    }
  });
  test("extends Backbone.Router", function() {
    return _.each(Backbone.Router.prototype, __bind(function(value, propName) {
      ok(Fixtures.PostsController.prototype[propName], "Knockback.Controller prototype should have the '" + propName + "' property");
      return ok(this.controller[propName], "Knockback.Controller instance should have the '" + propName + "' property");
    }, this));
  });
  test("inverse routes", function() {
    return deepEqual(this.controller.inverseRoutes(), this.inverseRoutes);
  });
  test("cached inverse routes", function() {
    this.controller.inverseRoutes();
    return deepEqual(this.controller._inverseRoutes, this.inverseRoutes);
  });
  test("find handler from inverse route", function() {
    var handlers;
    handlers = Backbone.history.handlers = [
      {
        route: new RegExp('^blogs/([^/]*)/posts$'),
        callback: function() {}
      }, {
        route: new RegExp('^blogs/([^/]*)/posts/([^/]*)$'),
        callback: function() {}
      }
    ];
    deepEqual(this.controller.handlerForRoute('index'), handlers[0], "should find first handler");
    return deepEqual(this.controller.handlerForRoute('show'), handlers[1], "should find second handler");
  });
  test("return null if no handler found for route", function() {
    return equal(this.controller.handlerForRoute('asdf'), null);
  });
  test("wrap handler callback function with Knockback.Controller filter function", function() {
    equal(this.controller.handlerForRoute('index').callback, this.controller._wrapped['index'], "index action should have filters");
    return equal(this.controller.handlerForRoute('show').callback, this.controller._wrapped['show'], "show action should have filters");
  });
  test("new handler function wraps original handler function", function() {
    Backbone.history.loadUrl('blogs/123/posts');
    equal(this.controller.lastAction, 'Posts#index', 'should call the index action');
    Backbone.history.loadUrl('blogs/123/posts/456');
    return equal(this.controller.lastAction, 'Posts#show', 'should call the show action');
  });
  module("Knockback.Controller: filtersForAction", {
    setup: function() {
      Backbone.history = new Backbone.History;
      Backbone.history.options = {
        root: '/'
      };
      this.empty = new Fixtures.EmptyFilters;
      this.singular = new Fixtures.SingularFilters;
      this.plural = new Fixtures.PluralFilters;
      this.action = new Fixtures.ActionFilters;
      return this.combined = new Fixtures.CombinedFilters;
    },
    teardown: function() {
      return delete Backbone.history;
    }
  });
  test("returns empty array by default for all filters", function() {
    deepEqual(this.empty.filtersForAction('foo', 'before'), []);
    return deepEqual(this.empty.filtersForAction('foo', 'after'), []);
  });
  test("returns an empty array when the filter type is not recognized", function() {
    deepEqual(this.empty.filtersForAction('foo', 'asdf'), []);
    return deepEqual(this.empty.filtersForAction('foo'), []);
  });
  test("raises an error when the action is not recognized", function() {
    raises(__bind(function() {
      return this.combined.filtersForAction('asdf', 'before');
    }, this));
    return raises(__bind(function() {
      return this.combined.filtersForAction(null, 'before');
    }, this));
  });
  test("accepts the name of a single function", function() {
    deepEqual(this.singular.filtersForAction('foo', 'before'), [this.singular.before_all]);
    return deepEqual(this.singular.filtersForAction('foo', 'after'), [this.singular.after_all]);
  });
  test("accepts an array of function names", function() {
    return deepEqual(this.plural.filtersForAction('foo', 'before'), [this.plural.a, this.plural.b, this.plural.c]);
  });
  test("supports action-specific filters with the 'before_action' and 'after_action' syntax", function() {
    deepEqual(this.action.filtersForAction('foo_bar', 'before'), [this.action.a]);
    return deepEqual(this.action.filtersForAction('foo_bar', 'after'), [this.action.a, this.action.b, this.action.c]);
  });
  test("combines global filters with action-specific filters", function() {
    deepEqual(this.combined.filtersForAction('foo_bar', 'before'), [this.combined.before_all, this.combined.a, this.combined.b]);
    return deepEqual(this.combined.filtersForAction('foo_bar', 'after'), [this.combined.after_all, this.combined.a, this.combined.b, this.combined.c]);
  });
  module("Knockback.Controller: running filters", {
    setup: function() {
      Backbone.history = new Backbone.History;
      Backbone.history.options = {
        root: '/'
      };
      this.combined = new Fixtures.CombinedFilters;
      return this.args = new Fixtures.ArgFilters;
    },
    teardown: function() {
      return delete Backbone.history;
    }
  });
  test("calls all applicable filter functions with the controller as the 'this' object", function() {
    Backbone.history.loadUrl('combined/foo/bar');
    equal(this.combined.lastAction, 'Combined#foo_bar');
    deepEqual(this.combined.filtersRan['before'], ['#before_all', '#a', '#b']);
    return deepEqual(this.combined.filtersRan['after'], ['#after_all', '#a', '#b', '#c']);
  });
  test("arguments to filters are the same as the action's arguments", function() {
    Backbone.history.loadUrl('arg/foo');
    deepEqual(this.args.argumentsGiven.before, ['arg/foo']);
    return deepEqual(this.args.argumentsGiven.after, ['arg/foo']);
  });
}).call(this);
