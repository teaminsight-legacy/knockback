window.Fixtures = {}

# Used to hold fake a response from an AJAX call to the API
Fixtures.BackboneSyncResponse = {}

# Non-AJAX replacement for Backbone.sync to simplify testing
Fixtures.testSync = (httpMethod, model, options) ->
  options.success Fixtures.BackboneSyncResponse, 200, null


Fixtures.Post = Knockback.Model.extend
  observables:
    name: ""
    tags: []
    meta: {}

  relations:
    author: 'Fixtures.Author'
    comments: 'Fixtures.CommentsCollection'

Fixtures.Post.prototype.sync = Fixtures.testSync

Fixtures.PostsCollection = Backbone.Collection.extend
  model: Fixtures.Post

Fixtures.Author = Knockback.Model.extend
  observables:
    name: ""

  relations:
    posts: 'Fixtures.PostsCollection'

Fixtures.Comment = Knockback.Model.extend
  observables:
    content: ""
    position: 0

  relations:
    post: 'Fixtures.Post'

Fixtures.CommentsCollection = Backbone.Collection.extend
  model: Fixtures.Comment

Fixtures.ProxyModel = Knockback.Model.extend
  proxied: ['getThis', 'setThis']

  setThis: ->
    window.thisValueForKnockbackModelProxyTest = @

  getThis: ->
    window.thisValueForKnockbackModelProxyTest

Fixtures.IgnoreProxyModel = Knockback.Model.extend
  proxied: ['x', 'foo']

  initialize: (attrs, options) ->
    @x = 23
    Knockback.Model.prototype.initialize.apply @, [attrs, options]

