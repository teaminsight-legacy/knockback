Knockback.Model = Backbone.Model.extend

  initialize: (attrs, options) ->
    @_bindProxiedMethods()
    @_initRelations attrs, options
    @_initAttributes attrs, options

  set: (attrs, options) ->
    return false unless Backbone.Model.prototype.set.apply @, [attrs, options]

    # keep related models in sync
    if @_relationsInitialized
      _.each attrs, (value, key) =>
        if @relations[key] and @[key]
          relation = @[key].ref(true)
          if relation.set
            relation.set value, options # belongsTo
          else if relation.reset
            relation.reset value, options # hasMany

    return this

  includeObservables: (objs...) ->
    obj = _.extend {}, objs...
    _.each _.functions(obj), (method) =>
      if @[method]
        throw "dependentObservable would overwrite existing property or method: '#{method}'"
      @[method] = ko.dependentObservable(obj[method], @, deferEvaluation: true)

  parse: (response, xhr) ->
    if @ajaxPrefix
      responseAttrs = response[@ajaxPrefix]
      _.each @relations, (className, relationName) =>
        if response[relationName] and not responseAttrs[relationName]
          responseAttrs[relationName] = response[relationName]
      responseAttrs
    else
      response

  _bindProxiedMethods: ->
    proxiedFunctions = _.select (@proxied || []), (methodName) =>
      _.isFunction(@[methodName])
    _.bindAll @, proxiedFunctions... if proxiedFunctions.length > 0

  # Create knockout observables for attributes listed in the observable property and assign default
  # values to the attribute/observable. If the default value is an array, an observableArray will
  # be created instead. Events on the backbone model and the observable are bound so that an update
  # to the model will notify the observable and an update to an observable will notify the model.
  _initAttributes: (attrs, options) ->
    @observables = @observables || {}
    newAttrs = {}

    # Create an ID observable for the "primary key" attribute
    @ID = ko.observable(attrs[@idAttribute] || null)
    @bind "change:#{@idAttribute}", (model, newId) =>
      @ID(newId)

    # Set default values for the given observables
    _.each @observables, (value, key) =>
      safeValue = if attrs[key]
        attrs[key] # value given as constructor argument
      else if value and typeof value == 'object'
        _.clone(value) # mutable objects should be cloned
      else
        value
      newAttrs[key] = safeValue unless _.isFunction(value)

    allAttrs = _.extend(newAttrs, attrs)
    # Create observables for all attributes, even if they are not listed in observables.
    # Our views/presenters depend on this behavior currently.
    _.each allAttrs, (value, key) =>
      unless @_wouldOverwriteExistingProperty(key, not not @observables[key])
        @_initObservable(key, value)

    _.each _.functions(@observables), (methodName) =>
      unless @[methodName]
        throw "cannot create dependentObservable because model has no method '#{methodName}'"
      if Knockback.Model.prototype[methodName]
        throw "dependentObservable would override base class method '#{methodName}'"

      @[methodName] = ko.dependentObservable(@[methodName], @, deferEvaluation: true)

    @set allAttrs, options

  # Create a knockout binding for the given attribute
  _initObservable: (key, value) ->
    @[key] = if _.isArray(value)
      ko.observableArray(value)
    else
      ko.observable(value)

    # Update the knockout binding when the model changes
    @bind "change:#{key}", (model, newValue) =>
      @[key](newValue)

    # Update the model when a knockout binding changes
    @[key].subscribe (newValue) =>
      h = {}
      h[key] = newValue
      @.set h

  _wouldOverwriteExistingProperty: (key, raiseOnError=true) ->
    if key == @idAttribute
      if raiseOnError
        throw "you cannot make the '#{@idAttribute}' observable because it is the idAttribute"
      true
    else if @[key]
      if raiseOnError
        throw "observable attribute '#{key}' would overwrite an existing property or method"
      true
    else
      false

  _initRelations: (attrs, options) ->
    @relations = @relations || {}

    _.each @relations, (className, relationName) =>
      if @[relationName]
        throw "relation '#{relationName}' would overwrite an existing property or method"

      relation = @[relationName] = new Knockback.Relation
        name: relationName
        sourceClass: className
        target: @

      klass = relation.sourceConstructor()
      if klass.prototype.set # singular relation
        @["#{relationName}_display"] = ko.observable({})
      else if klass.prototype.reset
        @["#{relationName}_display"] = ko.observableArray()

    @_relationsInitialized = true

