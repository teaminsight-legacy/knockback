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
      meta: {},
      tagList: function() {}
    },
    relations: {
      author: 'Fixtures.Author',
      comments: 'Fixtures.CommentsCollection'
    },
    tagList: function() {
      return this.tags().join(', ');
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
  Fixtures.Circular1 = Knockback.Model.extend({
    relations: {
      other: 'Fixtures.Circular2'
    }
  });
  Fixtures.Circular2 = Knockback.Model.extend({
    relations: {
      other: 'Fixtures.Circular1'
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
  module('Knockback.Relation', {
    setup: function() {
      return this.relation = new Knockback.Relation({
        name: 'foo',
        sourceClass: 'Foo',
        target: {}
      });
    }
  });
  test('should be an object', function() {
    return ok(this.relation);
  });
  test('public methods', function() {
    var instanceMethods;
    instanceMethods = ['ref', 'sourceConstructor'];
    return _.each(instanceMethods, __bind(function(method) {
      return ok(this.relation[method], "relation should have the '" + method + "' instance method");
    }, this));
  });
  module('Knockback.Relation#constructor');
  test('sets instance variables', function() {
    var config, relation;
    config = {
      name: 'foo',
      sourceClass: 'Foo',
      displayName: 'foo_display',
      inverse: 'bar',
      target: {
        foo: 'bar'
      }
    };
    relation = new Knockback.Relation(config);
    return _.each(config, __bind(function(v, k) {
      return equal(relation[k], v);
    }, this));
  });
  test("requires 'name' in config", function() {
    return raises((function() {
      return new Knockback.Relation;
    }), /you must specify a relation's 'name' property/);
  });
  test("requires 'sourceClass' in config", function() {
    return raises((function() {
      return new Knockback.Relation({
        name: 'foo'
      });
    }), /you must specify a relation's 'sourceClass' property/);
  });
  test("requires 'target' object in config", function() {
    return raises((function() {
      return new Knockback.Relation({
        name: 'foo',
        sourceClass: 'Foo'
      });
    }), /you must specify a relation's 'target' property/);
  });
  module('Knockback.Relation#sourceConstructor', {
    setup: function() {
      return this.relation = new Knockback.Relation({
        name: 'foo',
        sourceClass: 'Fixtures.Post',
        target: {}
      });
    }
  });
  test('returns the constructor for the sourceClass', function() {
    return equal(this.relation.sourceConstructor(), Fixtures.Post);
  });
  test('raises exception if sourceClass is not defined', function() {
    var rel;
    rel = new Knockback.Relation({
      name: 'foo',
      sourceClass: 'Abcdefghijklmnopqrstuvwxyz',
      target: {}
    });
    return raises((function() {
      return rel.sourceConstructor();
    }), /sourceClass 'Abcdefghijklmnopqrstuvwxyz' is not defined/);
  });
  module('Knockback.Relation#ref', {
    setup: function() {
      this.target = new Fixtures.Post;
      this.relationConfig = {
        name: 'author',
        sourceClass: 'Fixtures.Author',
        target: this.target
      };
      return this.relation = new Knockback.Relation(this.relationConfig);
    }
  });
  test('raise exception is sourceClass is not defined', function() {
    var rel;
    this.relationConfig.sourceClass = 'Abcdefghijklmnopqrstuvwxyz';
    rel = new Knockback.Relation(this.relationConfig);
    return raises((function() {
      return rel.ref();
    }), /sourceClass 'Abcdefghijklmnopqrstuvwxyz' is not defined/);
  });
  test('returns an instance of sourceClass', function() {
    return equal(this.relation.ref().constructor, Fixtures.Author);
  });
  test('caches the instance', function() {
    this.relation.ref();
    equal(this.relation._cached.constructor, Fixtures.Author);
    return equal(this.relation.ref().constructor, Fixtures.Author);
  });
  module('Knockback.Relation#ref for singular relations', {
    setup: function() {
      this.targetAttributes = {
        name: 'First Post',
        author: {
          name: 'Joe Test'
        }
      };
      this.target = new Fixtures.Post;
      this.relationConfig = {
        name: 'author',
        sourceClass: 'Fixtures.Author',
        target: this.target
      };
      return this.relation = new Knockback.Relation(this.relationConfig);
    }
  });
  test('source model is initialized with default attributes by default', function() {
    return deepEqual(this.relation.ref().attributes, {
      name: ''
    });
  });
  test('source model is initialized using nested attributes on the target model', function() {
    var rel;
    this.relationConfig.target = new Fixtures.Post(this.targetAttributes);
    rel = new Knockback.Relation(this.relationConfig);
    return equal(rel.ref().get('name'), 'Joe Test');
  });
  test('calls the #{name}_display method on the target with the source model', function() {
    return equal(this.relation.ref(), this.target.author_display());
  });
  module('Knockback.Relation#ref for plural relations', {
    setup: function() {
      this.targetAttributes = {
        name: 'First Post',
        comments: [
          {
            content: 'foo'
          }, {
            content: 'bar'
          }
        ]
      };
      this.target = new Fixtures.Post(this.targetAttributes);
      this.relationConfig = {
        name: 'comments',
        sourceClass: 'Fixtures.CommentsCollection',
        target: this.target
      };
      return this.relation = new Knockback.Relation(this.relationConfig);
    }
  });
  test('source collection is initialized with an empty array by default', function() {
    var rel;
    this.relationConfig.target = new Fixtures.Post;
    rel = new Knockback.Relation(this.relationConfig);
    return deepEqual(rel.ref().models, []);
  });
  test('initializes the source collection based on nested attributes', function() {
    return deepEqual(this.relation.ref().pluck('content'), ['foo', 'bar']);
  });
  test('calls the #{name}_display method on the target with the source collection', function() {
    return deepEqual(this.relation.ref().models, this.target.comments_display());
  });
  test('target#{name}_display updates when source collection is reset', function() {
    var comments, commentsCollection, newComments;
    expect(2);
    commentsCollection = this.relation.ref();
    newComments = [
      {
        content: 'yay'
      }, {
        content: 'nay'
      }
    ];
    this.target.comments_display.subscribe(function() {
      return ok(true, "triggered comments_display 'subscribe' event");
    });
    commentsCollection.reset(newComments);
    comments = _.map(this.target.comments_display(), function(c) {
      return c.get('content');
    });
    return deepEqual(comments, ['yay', 'nay']);
  });
  test('target#{name}_display updates when an item is added to the source collection', function() {
    var comments, commentsCollection;
    expect(3);
    commentsCollection = this.relation.ref();
    this.target.comments_display.subscribe(function() {
      return ok(true, "triggered comments_display 'subscribe' event");
    });
    commentsCollection.add({
      content: 'added'
    });
    comments = _.map(this.target.comments_display(), function(c) {
      return c.get('content');
    });
    return deepEqual(comments, ['foo', 'bar', 'added']);
  });
  test('target#{name}_display updates when an item is removed from the source collection', function() {
    var comments, commentsCollection;
    expect(2);
    commentsCollection = this.relation.ref();
    this.target.comments_display.subscribe(function() {
      return ok(true, "triggered comments_display 'subscribe' event");
    });
    commentsCollection.remove(this.relation.ref().first());
    comments = _.map(this.target.comments_display(), function(c) {
      return c.get('content');
    });
    return deepEqual(comments, ['bar']);
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
  module("Knockback.Model: dependentObservables");
  test('create dependentObservables for methods on models', function() {
    var p;
    p = new Fixtures.Post;
    ok(p.tagList.__ko_proto__, "'tagList' should be observable");
    return ok(p.tagList.getDependenciesCount, "'tagList' should be a dependentObservable");
  });
  test('dependentObservables wrap methods on model', function() {
    var p;
    p = new Fixtures.Post({
      tags: ['foo', 'bar']
    });
    return equal(p.tagList(), 'foo, bar');
  });
  test('raises error if method is not defined on model', function() {
    var M;
    M = Knockback.Model.extend({
      observables: {
        foo: function() {}
      }
    });
    return raises((function() {
      return new M;
    }), /cannot create dependentObservable because model has no method 'foo'/);
  });
  test('raises error if method is a Backbone.Model or Knockback.Model method', function() {
    var M;
    M = Knockback.Model.extend({
      observables: {
        save: function() {}
      }
    });
    return raises((function() {
      return new M;
    }), /dependentObservable would override base class method 'save'/);
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
    }), /sourceClass 'Foo' is not defined/);
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
    equal(p.author.ref().constructor.prototype, Fixtures.Author.prototype);
    return equal(p.author.ref().name(), "");
  });
  test("creates an observable '_display' method", function() {
    var model, p;
    p = new Fixtures.Post;
    ok(p.author_display, "model should have 'author_display' property");
    ok(p.author_display.__ko_proto__, "'author_display' property should be an observable");
    model = p.author.ref();
    return equal(p.author_display(), model);
  });
  test("initial value for _display method is an empty object", function() {
    var p;
    p = new Fixtures.Post;
    return deepEqual({}, p.author_display());
  });
  test("initialize belongsTo relation with nested attributes", function() {
    var p;
    p = new Fixtures.Post({
      author: {
        name: 'Foo Bar'
      }
    });
    equal(p.author.ref().name(), 'Foo Bar');
    return equal(p.author_display().name(), 'Foo Bar');
  });
  test("attribute change updates related model's attributes", function() {
    var p;
    expect(3);
    p = new Fixtures.Post;
    p.author.ref().name.subscribe(function() {
      return ok(true);
    });
    p.author.ref().bind('change:name', function() {
      return ok(true);
    });
    p.set({
      author: {
        name: 'Foo Bar'
      }
    });
    return equal(p.author.ref().name(), 'Foo Bar');
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
    ok(this.post.comments.ref().models, "'comments' property should be a backbone collection");
    ok(this.post.comments.ref().constructor.prototype, Fixtures.CommentsCollection.prototype);
    return deepEqual(this.post.comments.ref().models, []);
  });
  test("creates an observableArray '_display' method", function() {
    ok(this.post.comments_display, "model should have a 'comments_display' property");
    ok(this.post.comments_display.__ko_proto__, "'comments_display' property should be an observable");
    ok(this.post.comments_display.push, "'comments_display' property should be an observableArray");
    deepEqual(this.post.comments_display(), []);
    deepEqual(this.post.comments.ref().models, []);
    return deepEqual(this.post.comments_display(), this.post.comments.ref().models);
  });
  test("initial value for _display method is an empty array", function() {
    var p;
    p = new Fixtures.Post;
    return deepEqual([], p.comments_display());
  });
  test("initialize hasMany relation with nested array of attributes", function() {
    var p;
    p = new Fixtures.Post({
      comments: this.comments
    });
    deepEqual(_.pluck(p.comments.ref().models, 'attributes'), this.comments);
    return deepEqual(_.pluck(p.comments_display(), 'attributes'), this.comments);
  });
  test("collection resets when attribute changes", function() {
    expect(3);
    this.post.bind('change:comments', function() {
      return ok(true);
    });
    this.post.comments.ref().bind('reset', function() {
      return ok(true);
    });
    this.post.set({
      comments: this.comments
    });
    return deepEqual(_.pluck(this.post.comments.ref().models, 'attributes'), this.comments);
  });
  test("knockout binding updates when collection is reset", function() {
    expect(3);
    this.post.comments.ref().bind('reset', function() {
      return ok(true);
    });
    this.post.comments_display.subscribe(function() {
      return ok(true);
    });
    this.post.comments.ref().reset(this.comments);
    return deepEqual(_.pluck(this.post.comments_display(), 'attributes'), this.comments);
  });
  test("knockout binding updates when an item is added to the collection", function() {
    expect(4);
    this.post.comments.ref().bind('add', function() {
      return ok(true, "comments 'add' event was triggered");
    });
    this.post.comments_display.subscribe(function() {
      return ok(true, "comments_display 'subscribe' event was triggered");
    });
    this.post.comments.ref().add(this.comments[0]);
    return deepEqual(_.pluck(this.post.comments_display(), 'attributes'), [this.comments[0]]);
  });
  test("knockout binding updates when an item is removed from the collection", function() {
    expect(3);
    this.post.comments.ref().reset(this.comments);
    this.post.comments.ref().bind('remove', function() {
      return ok(true, "comments 'remove' event was triggered");
    });
    this.post.comments_display.subscribe(function() {
      return ok(true, "comments_display 'subscribe' event was triggered");
    });
    this.post.comments.ref().remove(this.post.comments.ref().first());
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
    this.post.comments.ref().add(positionalComments);
    commentsOrder = _.map(this.post.comments_display(), function(comment) {
      return comment.position();
    });
    lastPosition = -1;
    return _.each(this.post.comments_display(), __bind(function(comment) {
      ok(comment.position() > lastPosition, "comments_display() should display comments in order, but order was [" + commentsOrder + "]");
      return lastPosition = comment.position();
    }, this));
  });
  module('Knockback.Model: circular relations');
  test('should not cause a stack overflow', function() {
    return new Fixtures.Circular1;
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
    equal(this.post.author.ref().name(), 'Joe Test');
    return deepEqual(this.post.comments.ref().pluck('content'), ['foo']);
  });
  test("should look for relations in top level of response", function() {
    this.response = _.extend(this.response, this.relations);
    Fixtures.BackboneSyncResponse = this.response;
    this.post.save();
    equal(this.post.author.ref().name(), 'Joe Test');
    return deepEqual(this.post.comments.ref().pluck('content'), ['foo']);
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
    this.post.author.ref().bind('change', function() {
      return events['author/change'].actual += 1;
    });
    this.post.comments.ref().bind('add', function() {
      return events['comments/add'].actual += 1;
    });
    this.post.comments.ref().bind('reset', function() {
      return events['comments/reset'].actual += 1;
    });
    this.response = _.extend(this.response, this.relations);
    Fixtures.BackboneSyncResponse = this.response;
    this.post.save();
    return _.each(events, function(info, eventName) {
      return equal(info.actual, info.expected, "'" + eventName + "' event should be called once, but was called " + info.actual + " times");
    });
  });
  module('Knockback.Model#includeObservables', {
    setup: function() {
      this.modelClass = Knockback.Model.extend({
        observables: {
          foo: 'foo',
          bar: 'bar'
        }
      });
      this.model = new this.modelClass;
      return this.presenterMethods = {
        fooBar: function() {
          return "" + (this.foo()) + " " + (this.bar());
        },
        barFoo: function() {
          return "" + (this.bar()) + " " + (this.foo());
        },
        qwerty: 3
      };
    }
  });
  test('creates a dependentObservable for each function in the object', function() {
    this.model.includeObservables(this.presenterMethods);
    ok(this.model.fooBar, 'model should have a #fooBar method');
    ok(this.model.fooBar.__ko_proto__, '#fooBar should be observable');
    ok(this.model.barFoo, 'model should have a #barFoo method');
    ok(this.model.fooBar.__ko_proto__, '#barFoo should be observable');
    equal(this.model.fooBar(), 'foo bar');
    return equal(this.model.barFoo(), 'bar foo');
  });
  test("the dependentObservable return value changes when the model's attributes change", function() {
    this.model.includeObservables(this.presenterMethods);
    this.model.set({
      foo: 'bananas'
    });
    return equal(this.model.fooBar(), 'bananas bar');
  });
  test('skips object keys that are not functions', function() {
    try {
      this.model.includeObservables(this.presenterMethods);
      return ok(!this.model.qwerty, 'model should not have a #qwerty property');
    } catch (ex) {
      return ok(false, 'should not throw an exception');
    }
  });
  test('raises exception if a method with the same name already exists on the model', function() {
    var P;
    P = {
      save: function() {
        return 'me';
      }
    };
    return raises((__bind(function() {
      return this.model.includeObservables(P);
    }, this)), /dependentObservable would overwrite existing property or method: 'save'/);
  });
  test('merges methods from multiple objects', function() {
    var A, B;
    A = {
      fooBar: function() {
        return 'AAAAAA';
      },
      really: function() {
        return 'really?';
      }
    };
    B = {
      really: function() {
        return 'REALLY?!?!';
      },
      inspect: function() {
        return "foo: " + (this.foo()) + ", bar: " + (this.bar());
      }
    };
    this.model.includeObservables(this.presenterMethods, A, B);
    equal(this.model.fooBar(), 'AAAAAA');
    equal(this.model.barFoo(), 'bar foo');
    equal(this.model.really(), 'REALLY?!?!');
    return equal(this.model.inspect(), 'foo: foo, bar: bar');
  });
  module('Knockback.Model deferred evaluation of dependent observables', {
    setup: function() {
      var depObs;
      this.dependentObservables = depObs = {
        informFunction: function() {
          window.evaluationPerformed = true;
          return 42;
        }
      };
      this.modelClass = Knockback.Model.extend({
        observables: {
          inform: function() {}
        },
        inform: depObs.informFunction
      });
      return this.model = new this.modelClass;
    },
    teardown: function() {
      return delete window.evaluationPerformed;
    }
  });
  test('specified in model', function() {
    ok(!window.evaluationPerformed, 'evaluation function should not have been called yet');
    equal(42, this.model.inform());
    return equal(true, window.evaluationPerformed, 'evaluation function should have been called');
  });
  test('included in model', function() {
    this.model.includeObservables(this.dependentObservables);
    ok(!window.evaluationPerformed, 'evaluation function should not have been called yet');
    equal(42, this.model.informFunction());
    return equal(true, window.evaluationPerformed, 'evaluation function should have been called');
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
