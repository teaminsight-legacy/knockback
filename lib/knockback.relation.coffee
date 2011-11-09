# Finds the JavaScript object given in the className string without using eval.
# For example, passing 'Foo.Bar.Model' would find and return window.Foo.Bar.Model.
# This method is needed to allow our backbone models to refer to related models before those
# models are defined.
Knockback.objectReferenceFor = (className) ->
  namespace = window
  components = className.split('.')
  while identifier = components.shift()
    namespace = namespace[identifier]
  namespace


class Knockback.Relation

  constructor: (config={}) ->
    throw "you must specify a relation's 'name' property" unless config.name
    throw "you must specify a relation's 'sourceClass' property" unless config.sourceClass
    throw "you must specify a relation's 'target' property" unless config.target
    @name = config.name
    @target = config.target
    @sourceClass = config.sourceClass
    @displayName = config.displayName
    @inverse = config.inverse

  sourceConstructor: ->
    constructor = Knockback.objectReferenceFor @sourceClass
    throw "sourceClass '#{@sourceClass}' is not defined" unless constructor
    constructor

  ref: ->
    return @_cached if @_cached
    nestedAttrs = @target.get(@name)
    source = new (@sourceConstructor())

    if source.attributes
      @_sourceModel(source, nestedAttrs)
    else if source.models
      @_sourceCollection(source, nestedAttrs)

    @_cached = source

  _sourceModel: (source, attrs) ->
    source.set attrs
    @target["#{@name}_display"](source)

  _sourceCollection: (source, models) ->
    display = @target["#{@name}_display"]

    source.bind 'reset', -> display(source.models)
    source.bind 'remove', -> display(source.models)
    source.bind 'add', ->
      display(source.models)
      display.sort (m1, m2) ->  m1.position() - m2.position() if m1.position

    source.reset models if models
