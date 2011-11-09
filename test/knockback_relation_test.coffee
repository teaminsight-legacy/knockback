###################################################################################################
module 'Knockback.Relation',
  setup: ->
    @relation = new Knockback.Relation name: 'foo', sourceClass: 'Foo', target: {}

test 'should be an object', ->
  ok @relation

test 'public methods', ->
  instanceMethods = ['ref', 'sourceConstructor']
  _.each instanceMethods, (method) =>
    ok @relation[method], "relation should have the '#{method}' instance method"


###################################################################################################
module 'Knockback.Relation#constructor'

test 'sets instance variables', ->
  config =
    name: 'foo'
    sourceClass: 'Foo'
    displayName: 'foo_display'
    inverse: 'bar'
    target: {foo: 'bar'}

  relation = new Knockback.Relation config
  _.each config, (v, k) =>
    equal relation[k], v

test "requires 'name' in config", ->
  raises (-> new Knockback.Relation), /you must specify a relation's 'name' property/

test "requires 'sourceClass' in config", ->
  raises (-> new Knockback.Relation name: 'foo'), /you must specify a relation's 'sourceClass' property/

test "requires 'target' object in config", ->
  raises (-> new Knockback.Relation name: 'foo', sourceClass: 'Foo'), /you must specify a relation's 'target' property/


###################################################################################################
module 'Knockback.Relation#sourceConstructor'
  setup: ->
    @relation = new Knockback.Relation name: 'foo', sourceClass: 'Fixtures.Post', target: {}

test 'returns the constructor for the sourceClass', ->
  equal @relation.sourceConstructor(), Fixtures.Post

test 'raises exception if sourceClass is not defined', ->
  rel = new Knockback.Relation name: 'foo', sourceClass: 'Abcdefghijklmnopqrstuvwxyz', target: {}
  raises (-> rel.sourceConstructor()), /sourceClass 'Abcdefghijklmnopqrstuvwxyz' is not defined/


###################################################################################################
module 'Knockback.Relation#ref',
  setup: ->
    @target = new Fixtures.Post
    @relationConfig =
      name: 'author'
      sourceClass: 'Fixtures.Author',
      target: @target
    @relation = new Knockback.Relation @relationConfig

test 'raise exception is sourceClass is not defined', ->
  @relationConfig.sourceClass = 'Abcdefghijklmnopqrstuvwxyz'
  rel = new Knockback.Relation @relationConfig
  raises (-> rel.ref()), /sourceClass 'Abcdefghijklmnopqrstuvwxyz' is not defined/

test 'returns an instance of sourceClass', ->
  equal @relation.ref().constructor, Fixtures.Author

test 'caches the instance', ->
  @relation.ref()
  equal @relation._cached.constructor, Fixtures.Author
  equal @relation.ref().constructor, Fixtures.Author


###################################################################################################
module 'Knockback.Relation#ref for singular relations',
  setup: ->
    @targetAttributes =
      name: 'First Post'
      author:
        name: 'Joe Test'
    @target = new Fixtures.Post
    @relationConfig =
      name: 'author'
      sourceClass: 'Fixtures.Author',
      target: @target
    @relation = new Knockback.Relation @relationConfig

test 'source model is initialized with default attributes by default', ->
  deepEqual @relation.ref().attributes, {name: ''}

test 'source model is initialized using nested attributes on the target model', ->
  @relationConfig.target = new Fixtures.Post @targetAttributes
  rel = new Knockback.Relation @relationConfig
  equal rel.ref().get('name'), 'Joe Test'

test 'calls the #{name}_display method on the target with the source model', ->
  equal @relation.ref(), @target.author_display()


###################################################################################################
module 'Knockback.Relation#ref for plural relations',
  setup: ->
    @targetAttributes =
      name: 'First Post'
      comments: [
        {content: 'foo'},
        {content: 'bar'}
      ]
    @target = new Fixtures.Post @targetAttributes
    @relationConfig =
      name: 'comments'
      sourceClass: 'Fixtures.CommentsCollection'
      target: @target
    @relation = new Knockback.Relation @relationConfig

test 'source collection is initialized with an empty array by default', ->
  @relationConfig.target = new Fixtures.Post
  rel = new Knockback.Relation @relationConfig
  deepEqual rel.ref().models, []

test 'initializes the source collection based on nested attributes', ->
  deepEqual @relation.ref().pluck('content'), ['foo', 'bar']

test 'calls the #{name}_display method on the target with the source collection', ->
  deepEqual @relation.ref().models, @target.comments_display()

test 'target#{name}_display updates when source collection is reset', ->
  expect 2
  commentsCollection = @relation.ref()
  newComments = [
    {content: 'yay'},
    {content: 'nay'}
  ]

  @target.comments_display.subscribe ->
    ok true, "triggered comments_display 'subscribe' event"

  commentsCollection.reset newComments
  comments = _.map(@target.comments_display(), (c) -> c.get('content'))
  deepEqual comments, ['yay', 'nay']

test 'target#{name}_display updates when an item is added to the source collection', ->
  expect 3
  commentsCollection = @relation.ref()

  @target.comments_display.subscribe ->
    # expected to be called twice because of the position sort
    ok true, "triggered comments_display 'subscribe' event"

  commentsCollection.add {content: 'added'}
  comments = _.map(@target.comments_display(), (c) -> c.get('content'))
  deepEqual comments, ['foo', 'bar', 'added']

test 'target#{name}_display updates when an item is removed from the source collection', ->
  expect 2
  commentsCollection = @relation.ref()

  @target.comments_display.subscribe ->
    ok true, "triggered comments_display 'subscribe' event"

  commentsCollection.remove @relation.ref().first()
  comments = _.map(@target.comments_display(), (c) -> c.get('content'))
  deepEqual comments, ['bar']
