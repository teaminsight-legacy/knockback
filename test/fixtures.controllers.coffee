Fixtures.PostsController = Knockback.Controller.extend
  routes:
    'blogs/:blog_id/posts': 'index'
    'blogs/:blog_id/posts/:id': 'show'

  index: (blog_id) ->
    @lastAction = 'Posts#index'

  show: (blog_id, id) ->
    @lastAction = 'Posts#show'

Fixtures.EmptyFilters = Knockback.Controller.extend
  routes:
    'empty/foo/:id': 'foo'

Fixtures.SingularFilters = Knockback.Controller.extend
  routes:
    'singular/foo/:id': 'foo'

  filters:
    before: 'before_all'
    after: 'after_all'

  before_all: ->
  after_all: ->

Fixtures.PluralFilters = Knockback.Controller.extend
  routes:
    'plural/foo': 'foo'

  filters:
    before: ['a', 'b', 'c']

  a: ->
  b: ->
  c: ->

Fixtures.ActionFilters = Knockback.Controller.extend
  routes:
    'action/foo/bar': 'foo_bar'

  filters:
    before_foo_bar: 'a'
    after_foo_bar: ['a', 'b', 'c']

  a: ->
  b: ->
  c: ->

Fixtures.CombinedFilters = Knockback.Controller.extend
  routes:
    'combined/foo/bar': 'foo_bar'

  filters:
    before: ['before_all', 'a']
    after: 'after_all'
    before_foo_bar: 'b'
    after_foo_bar: ['a', 'b', 'c']

  initialize: (options) ->
    Knockback.Controller.prototype.initialize.apply @, options
    @filtersRan =
      before: []
      after: []

  foo_bar: ->
    @lastAction = 'Combined#foo_bar'
    @actionRan = true

  runFilter: (name) ->
    beforeOrAfter = if @actionRan then 'after' else 'before'
    @filtersRan[beforeOrAfter].push(name)

  before_all: ->
    @runFilter('#before_all')

  after_all: ->
    @runFilter('#after_all')

  a: ->
    @runFilter('#a')

  b: ->
    @runFilter('#b')

  c: ->
    @runFilter('#c')

Fixtures.ArgFilters = Knockback.Controller.extend
  routes:
    'arg/foo': 'foo'

  filters:
    before: 'before'
    after: 'after'

  initialize: (options) ->
    Knockback.Controller.prototype.initialize.apply @, options
    @argumentsGiven =
      before: []
      after: []

  foo: ->
    'foo'

  before: ->
    @argumentsGiven.before = Array.prototype.slice.call(arguments)

  after: ->
    @argumentsGiven.after = Array.prototype.slice.call(arguments)

