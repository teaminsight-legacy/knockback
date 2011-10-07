(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
}).call(this);
