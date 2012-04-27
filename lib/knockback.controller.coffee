# Knockback.Controller wraps functions bound to backbone routes with the ability to run
# before and after filters. You can specify these filters declaratively in any object that
# extends Knockback.Controller. The filters specified must be strings that name instance methods
# for your controller object. Because Knockback.Controller extends Backbone.Router, you can specify
# your routes and filters in the same object.
#
#    var MyController = Knockback.Controller.extend
#
#      routes:
#        'foo/bar': 'foo_bar'
#        'biz/baz': 'biz_baz'
#
#      filters:
#        after: 'tearDown'                    # this method will run immediately after performing any action on this controller
#        before: ['setUp', 'register']        # you can specify multiple methods to run
#        before_foo_bar: ['getFoo', 'getBar'] # you can run action-specific filters
#        after_biz_baz: 'cry'
#        ...
#
# Please note that this implementation is dependent on the internal (non-public) API of
# Backbone.Router and Backbone.History, so backwards-compatible updates to backbone.js could still
# break the Knockback.Controller.
Knockback.Controller = Backbone.Router.extend

  # Wraps all route handler functions matching routes from this controller with a new function
  # that includes filter functionality.
  initialize: (options) ->
    @_wrapped = {}

    _.each @routes, (name, pattern) =>
      handler = @handlerForRoute(name)
      if handler and not @_wrapped[name]
        handler.callback = @_wrapped[name] = _.wrap handler.callback, (callback, urlFragment) =>
          @actionWithFilters name, callback, urlFragment

  # Map the routes object to a form useful for searching the Backbone.history.handlers array.
  inverseRoutes: () ->
    @_inverseRoutes ||= _.reduce @routes, ((memo, name, pattern) =>
      memo[name] = @_routeToRegExp(pattern).toString()
      memo
    ), {}

  # Returns the handler bound to the route with the given name.
  handlerForRoute: (routeName) ->
    routeExp = @inverseRoutes()[routeName]
    handlers = if Backbone.history then Backbone.history.handlers else []

    _.detect handlers, (handler) ->
      handler.route.toString() == routeExp

  # Replacement route handler function that includes filter functionality. All before and
  # before_action_name filters are run first. Then the original route handler function (action)
  # is called. Finally, the after and after_action_name filters are run. The arguments given to
  # the filter functions are the same as the argument given to the action, a urlFragment matching
  # the route bound to the action.
  actionWithFilters: (name, action, urlFragment) ->
    _.each @filtersForAction(name, 'before'), (filter) =>
      filter.apply @, [urlFragment]
    action(urlFragment)
    _.each @filtersForAction(name, 'after'), (filter) =>
      filter.apply @, [urlFragment]

  # Returns an array of all applicable filter methods for the given action and filterType.
  # The supported filter types are 'before' and 'after'.
  filtersForAction: (actionName, filterType) ->
    unless @inverseRoutes()[actionName]
      throw "cannot run filters for non-existent action, '#{actionName}'"

    @filters ||= {}
    global_filters = @filters[filterType] || []
    action_filters = @filters["#{filterType}_#{actionName}"] || []
    methodNames = [].concat(global_filters, action_filters)
    _.map methodNames, (methodName) =>
      @[methodName]

