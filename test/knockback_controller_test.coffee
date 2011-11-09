###################################################################################################
module "Knockback.Controller"

test "has extend method", ->
  ok Knockback.Controller.extend, "FiltersController should have an 'extend' method"
  ok Fixtures.PostsController.extend, "Fixtures.PostsController should have an 'extend' method"

test "create", ->
  new Fixtures.PostsController
  ok true


###################################################################################################
module "Knockback.Controller: initialization",
  setup: ->
    Backbone.history = new Backbone.History
    Backbone.history.options = root: '/'
    @controller = new Fixtures.PostsController
    toRegExp = Backbone.Router.prototype._routeToRegExp
    @inverseRoutes =
      'index': toRegExp('blogs/:blog_id/posts').toString()
      'show': toRegExp('blogs/:blog_id/posts/:id').toString()

  teardown: ->
    delete Backbone.history

test "extends Backbone.Router", ->
  _.each Backbone.Router.prototype, (value, propName) =>
    ok Fixtures.PostsController.prototype[propName],
      "Knockback.Controller prototype should have the '#{propName}' property"
    ok @controller[propName],
      "Knockback.Controller instance should have the '#{propName}' property"

test "inverse routes", ->
  deepEqual @controller.inverseRoutes(), @inverseRoutes

test "cached inverse routes", ->
  @controller.inverseRoutes()
  deepEqual @controller._inverseRoutes, @inverseRoutes

test "find handler from inverse route", ->
  handlers = Backbone.history.handlers = [
    {route: new RegExp('^blogs/([^/]*)/posts$'), callback: () ->},
    {route: new RegExp('^blogs/([^/]*)/posts/([^/]*)$'), callback: () ->},
  ]
  deepEqual @controller.handlerForRoute('index'), handlers[0], "should find first handler"
  deepEqual @controller.handlerForRoute('show'), handlers[1], "should find second handler"

test "return null if no handler found for route", ->
  equal @controller.handlerForRoute('asdf'), null

test "wrap handler callback function with Knockback.Controller filter function", ->
  equal @controller.handlerForRoute('index').callback, @controller._wrapped['index'],
    "index action should have filters"
  equal @controller.handlerForRoute('show').callback, @controller._wrapped['show'],
    "show action should have filters"

test "new handler function wraps original handler function", ->
  Backbone.history.loadUrl('blogs/123/posts')
  equal @controller.lastAction, 'Posts#index', 'should call the index action'

  Backbone.history.loadUrl('blogs/123/posts/456')
  equal @controller.lastAction, 'Posts#show', 'should call the show action'


###################################################################################################
module "Knockback.Controller: filtersForAction",
  setup: ->
    Backbone.history = new Backbone.History
    Backbone.history.options = root: '/'
    @empty = new Fixtures.EmptyFilters
    @singular = new Fixtures.SingularFilters
    @plural = new Fixtures.PluralFilters
    @action = new Fixtures.ActionFilters
    @combined = new Fixtures.CombinedFilters
  teardown: ->
    delete Backbone.history

test "returns empty array by default for all filters", ->
  deepEqual @empty.filtersForAction('foo', 'before'), []
  deepEqual @empty.filtersForAction('foo', 'after'), []

test "returns an empty array when the filter type is not recognized", ->
  deepEqual @empty.filtersForAction('foo', 'asdf'), []
  deepEqual @empty.filtersForAction('foo'), []

test "raises an error when the action is not recognized", ->
  raises => @combined.filtersForAction('asdf', 'before')
  raises => @combined.filtersForAction(null, 'before')

test "accepts the name of a single function", ->
  deepEqual @singular.filtersForAction('foo', 'before'), [@singular.before_all]
  deepEqual @singular.filtersForAction('foo', 'after'), [@singular.after_all]

test "accepts an array of function names", ->
  deepEqual @plural.filtersForAction('foo', 'before'), [@plural.a, @plural.b, @plural.c]

test "supports action-specific filters with the 'before_action' and 'after_action' syntax", ->
  deepEqual @action.filtersForAction('foo_bar', 'before'), [@action.a]
  deepEqual @action.filtersForAction('foo_bar', 'after'), [@action.a, @action.b, @action.c]

test "combines global filters with action-specific filters", ->
  deepEqual @combined.filtersForAction('foo_bar', 'before'),
    [@combined.before_all, @combined.a, @combined.b]
  deepEqual @combined.filtersForAction('foo_bar', 'after'),
    [@combined.after_all, @combined.a, @combined.b, @combined.c]


###################################################################################################
module "Knockback.Controller: running filters",
  setup: ->
    Backbone.history = new Backbone.History
    Backbone.history.options = root: '/'
    @combined = new Fixtures.CombinedFilters
    @args = new Fixtures.ArgFilters
  teardown: ->
    delete Backbone.history

test "calls all applicable filter functions with the controller as the 'this' object", ->
  Backbone.history.loadUrl('combined/foo/bar')
  equal @combined.lastAction, 'Combined#foo_bar'
  deepEqual @combined.filtersRan['before'], ['#before_all', '#a', '#b']
  deepEqual @combined.filtersRan['after'], ['#after_all', '#a', '#b', '#c']

test "arguments to filters are the same as the action's arguments", ->
  Backbone.history.loadUrl('arg/foo')
  deepEqual @args.argumentsGiven.before, ['arg/foo']
  deepEqual @args.argumentsGiven.after, ['arg/foo']

