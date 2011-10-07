module 'Knockback.Model',
  setup: ->
    @modelClass = Knockback.Model
    @model = new @modelClass

test 'is a backbone model', ->
  skipAttributes =
    _previousAttributes: true
    _changed: true
    ajaxPrefix: true
    disableSync: true

  _.each Backbone.Model.prototype, (value, key) =>
    return if skipAttributes[key]
    ok @modelClass.prototype[key], "class prototype should have the '#{key}' property"
    ok @model[key], "instance should have the '#{key}' property"

test 'initializes attributes', ->
  attrs = foo: 'foo', bar: 'bar'
  m = new @modelClass attrs
  equal m.get('foo'), attrs.foo
  equal m.get('bar'), attrs.bar

test "'ID' is an observable for the idAttribute", ->
  ok @model.ID, "should have an 'ID' property"
  ok @model.ID.__ko_proto__, "'ID' property should be an observable"

test "ID returns null for default value", ->
  same @model.ID(), null

test "ID is set during initialization", ->
  m = new @modelClass id: 7
  equal m.ID(), 7

test "ID is updated when the idAttribute is updated", ->
  expect 3
  @model.ID.subscribe (newValue) ->
    equal newValue, 42
  @model.bind 'change:id', (model, newValue) ->
    equal newValue, 42
  @model.set id: 42
  equal @model.ID(), 42

test "set method returns 'this' model on success", ->
  same @model.set(foo: 'bar'), @model

test "set method returns false on failure", ->
  M = Knockback.Model.extend
    validate: (attrs) -> 'invalid'
  m = new M
  same m.set(foo: 'bar'), false


###################################################################################################
module 'Knockback.Model: proxied methods',
  setup: ->
    @model = new Fixtures.ProxyModel

asyncTest "methods listed in proxied are bound to the model instance", ->
  expect 1
  setTimeout(@model.setThis, 0)
  setTimeout( (=>
    same @model.getThis(), @model
    start()
  ), 10)

test "non-methods listed in proxied are ignored", ->
  try
    new Fixtures.IgnoreProxyModel
    ok true
  catch err
    ok false, 'should ignore items in the proxied list that are not method names'

test "backbone methods don't get bound to the knockout model if proxied list is empty", ->
  p = new Fixtures.Post
  same p.save, Backbone.Model.prototype.save


###################################################################################################
module "Knockback.Model: observable attributes"

test 'set to default values during initialization', ->
  p = new Fixtures.Post
  equal p.get('name'), "", "'name' should be \"\""
  deepEqual p.get('tags'), []
  deepEqual p.get('meta'), {}

test 'separate instances should have separate values for default attributes', ->
  p1 = new Fixtures.Post
  p2 = new Fixtures.Post

  p1.get('tags').push('foo')
  deepEqual p1.get('tags'), ['foo']
  deepEqual p2.get('tags'), []

  _.extend(p1.get('meta'), foo: 'bar')
  deepEqual p1.get('meta'), foo: 'bar'
  deepEqual p2.get('meta'), {}

test 'knockout observables created for non-array attributes', ->
  p = new Fixtures.Post
  ok p.name.__ko_proto__, "'name' should be observable"
  ok not p.name.push, "'name' should not be an observableArray"

  ok p.meta.__ko_proto__, "'meta' should be observable"
  ok not p.meta.push, "'meta' should not be an observableArray"

test 'knockout observableArrays created for array attributes', ->
  p = new Fixtures.Post
  ok p.tags.__ko_proto__, "'tags' should be observable"
  ok p.tags.push, "'tags' should be an observableArray"

test 'observables match attributes used for initialization', ->
  c = new Fixtures.Comment content: 'foo', position: 3
  equal c.content(), 'foo'
  equal c.position(), 3

test 'throws an error if an observable attribute would overwrite an existing property', ->
  SomeModel = Knockback.Model.extend
    observables:
      save: 'foo'
  raises -> new SomeModel

test 'throws an error if the id attribute is given as an observable', ->
  SomeModel = Knockback.Model.extend
    observables:
      id: 'foo'
  raises -> new SomeModel


###################################################################################################
module "Knockback.Model: unspecified attributes"

test "observables should be created for unspecified attributes", ->
  p = new Fixtures.Post foo: 'bar'
  ok p.foo, "'foo' property should exist"
  equal p.foo(), 'bar'

test "skip creating observable if unspecified attribute would overwrite another property", ->
  p = new Fixtures.Post save: 'whales'
  equal p.save, Fixtures.Post.prototype.save
  equal p.get('save'), 'whales'


###################################################################################################
module "Knockback.Model: attribute events",

test "updates observable after attribute change", ->
  expect 2
  p = new Fixtures.Post
  p.name.subscribe (newValue) ->
    equal newValue, 'foo'
  p.set name: 'foo'
  equal p.name(), 'foo'

test "updates attribute after observable change", ->
  expect 2
  p = new Fixtures.Post
  p.bind 'change:name', (model, newValue) ->
    equal newValue, 'foo'
  p.name('foo')
  equal p.get('name'), 'foo'

test "update observableArray after array attribute change", ->
  ok false, 'TODO: how can we make it easier to update array attributes so that callbacks fire?'
  return

  expect 2
  p = new Fixtures.Post
  p.tags.subscribe (newValue) ->
    deepEqual newValue, [1, 2, 3]
  t = p.get('tags')
  t.push(1, 2, 3)
  p.set tags: t # doesn't fire event because referenced array was modified without backbone's knowledge
  deepEqual p.tags(), [1, 2, 3]

test "update array attribute after observableArray change", ->
  ok false, 'TODO: how can we make it easier to update array attributes so that callbacks fire?'
  return

  expect 2
  p = new Fixtures.Post
  p.bind 'change:tags', (model, newValue) ->
    deepEqual newValue, [1, 2, 3]
  p.tags.push(1, 2, 3)
  deepEqual p.get('tags'), [1, 2, 3]

test "events only fire once after backbone model change", ->
  expect 2
  p = new Fixtures.Post
  p.bind 'change:name', ->
    ok true
  p.name.subscribe ->
    ok true
  p.set name: 'foo'

test "events only fire once after observable change", ->
  expect 2
  p = new Fixtures.Post
  p.name.subscribe ->
    ok true
  p.bind 'change:name', ->
    ok true
  p.name('foo')


####################################################################################################
module "Knockback.Model: relations"

test "raise exception if relation model is not defined", ->
  SomeModel = Knockback.Model.extend
    relations:
      foo: 'Foo'
  raises (-> new SomeModel), /class 'Foo' is not defined for the 'foo' relation/

test 'throws an error if a relation would overwrite an existing property', ->
  SomeModel = Knockback.Model.extend
    relations:
      set: 'Fixtures.Author'
  raises -> new SomeModel


####################################################################################################
module "Knockback.Model: belongsTo relation"

test "create empty model for relation", ->
  p = new Fixtures.Post
  equal p.author.constructor.prototype, Fixtures.Author.prototype
  equal p.author.name(), ""

test "creates an observable '_display' method", ->
  p = new Fixtures.Post
  ok p.author_display, "model should have 'author_display' property"
  ok p.author_display.__ko_proto__, "'author_display' property should be an observable"
  equal p.author_display(), p.author

test "initialize belongsTo relation with nested attributes", ->
  p = new Fixtures.Post author: name: 'Foo Bar'
  equal(p.author.name(), 'Foo Bar')
  equal(p.author_display().name(), 'Foo Bar')

test "attribute change updates related model's attributes", ->
  expect 3
  p = new Fixtures.Post
  p.author.name.subscribe ->
    ok true
  p.author.bind 'change:name', ->
    ok true
  p.set author: name: 'Foo Bar'
  equal p.author.name(), 'Foo Bar'


####################################################################################################
module "Knockback.Model: hasMany relation",
  setup: ->
    @post = new Fixtures.Post
    @comments = [{content: 'foo', position: 0}, {content: 'bar', position: 0}]

test "relation method is a backbone collection", ->
  ok @post.comments, "model should have a 'comments' property"
  ok @post.comments.models, "'comments' property should be a backbone collection"
  ok @post.comments.constructor.prototype, Fixtures.CommentsCollection.prototype
  deepEqual @post.comments.models, []

test "creates an observableArray '_display' method", ->
  ok @post.comments_display, "model should have a 'comments_display' property"
  ok @post.comments_display.__ko_proto__, "'comments_display' property should be an observable"
  ok @post.comments_display.push, "'comments_display' property should be an observableArray"
  equal @post.comments_display(), @post.comments.models

test "initialize hasMany relation with nested array of attributes", ->
  p = new Fixtures.Post comments: @comments
  deepEqual _.pluck(p.comments.models, 'attributes'), @comments
  deepEqual _.pluck(p.comments_display(), 'attributes'), @comments

test "collection resets when attribute changes", ->
  expect 3
  @post.bind 'change:comments', ->
    ok true
  @post.comments.bind 'reset', ->
    ok true
  @post.set comments: @comments
  deepEqual _.pluck(@post.comments.models, 'attributes'), @comments

test "knockout binding updates when collection is reset", ->
  expect 3
  @post.comments.bind 'reset', ->
    ok true
  @post.comments_display.subscribe ->
    ok true
  @post.comments.reset @comments
  deepEqual _.pluck(@post.comments_display(), 'attributes'), @comments

test "knockout binding updates when an item is added to the collection", ->
  expect 4
  @post.comments.bind 'add', ->
    ok true, "comments 'add' event was triggered"
  @post.comments_display.subscribe ->
    # expecting this event to be called twice because comments are sorted after being added
    ok true, "comments_display 'subscribe' event was triggered"
  @post.comments.add @comments[0]
  deepEqual _.pluck(@post.comments_display(), 'attributes'), [@comments[0]]

test "knockout binding updates when an item is removed from the collection", ->
  expect 3
  @post.comments.reset @comments
  @post.comments.bind 'remove', ->
    ok true, "comments 'remove' event was triggered"
  @post.comments_display.subscribe ->
    ok true, "comments_display 'subscribe' event was triggered"
  @post.comments.remove @post.comments.first()
  deepEqual _.pluck(@post.comments_display(), 'attributes'), [@comments[1]]

test "knockout binding is sorted by position", ->
  positionalComments = [
    {content: 'biz', position:3},
    {content: 'bar', position:2},
    {content: 'foo', position:1},
    {content: 'baz', position:4}
  ]
  @post.comments.add positionalComments
  commentsOrder = _.map @post.comments_display(), (comment) ->
    comment.position()

  lastPosition = -1
  _.each @post.comments_display(), (comment) =>
    ok comment.position() > lastPosition,
      "comments_display() should display comments in order, but order was [#{commentsOrder}]"
    lastPosition = comment.position()


###################################################################################################
module 'Knockback.Model: saving',
  setup: ->
    @response =
      post:
        name: 'foo'
        tags: ['a', 'b', 'c']

    @relations =
      author:
        name: 'Joe Test'
      comments:
        [{content: 'foo'}]

    @postClass = Fixtures.Post.extend
      ajaxPrefix: 'post'
    @post = new @postClass

  teardown: ->
    Fixtures.BackboneSyncResponse = {}

test "should return response unmodified if no ajax prefix is defined", ->
  p = new Fixtures.Post
  attrs = p.parse(@response.post)
  deepEqual attrs, @response.post

test "should extract attributes from response using ajax prefix", ->
  attrs = @post.parse(@response)
  deepEqual attrs, @response.post

test "should update associations after save", ->
  @response.post = _.extend @response.post, @relations
  Fixtures.BackboneSyncResponse = @response
  @post.save()
  equal @post.author.name(), 'Joe Test'
  deepEqual @post.comments.pluck('content'), ['foo']

test "should look for relations in top level of response", ->
  @response = _.extend @response, @relations
  Fixtures.BackboneSyncResponse = @response
  @post.save()
  equal @post.author.name(), 'Joe Test'
  deepEqual @post.comments.pluck('content'), ['foo']

test "should trigger events for model and relations after save", ->
  events =
    'post/change':
      expected: 2, actual: 0
    'post/change:name':
      expected: 1, actual: 0
    'author/change':
      expected: 1, actual: 0
    'comments/add':
      expected: 0, actual: 0
    'comments/reset':
      expected: 1, actual: 0

  @post.bind 'change', -> events['post/change'].actual += 1
  @post.bind 'change:name', -> events['post/change:name'].actual += 1
  @post.author.bind 'change', -> events['author/change'].actual += 1
  @post.comments.bind 'add', -> events['comments/add'].actual += 1
  @post.comments.bind 'reset', -> events['comments/reset'].actual += 1

  @response = _.extend @response, @relations
  Fixtures.BackboneSyncResponse = @response
  @post.save()

  _.each events, (info, eventName) ->
    equal info.actual, info.expected,
      "'#{eventName}' event should be called once, but was called #{info.actual} times"

