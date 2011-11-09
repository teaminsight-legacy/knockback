(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  window.Knockback = {};
  Knockback.objectReferenceFor = function(className) {
    var components, identifier, namespace;
    namespace = window;
    components = className.split('.');
    while (identifier = components.shift()) {
      namespace = namespace[identifier];
    }
    return namespace;
  };
  Knockback.Relation = (function() {
    function Relation(config) {
      if (config == null) {
        config = {};
      }
      if (!config.name) {
        throw "you must specify a relation's 'name' property";
      }
      if (!config.sourceClass) {
        throw "you must specify a relation's 'sourceClass' property";
      }
      if (!config.target) {
        throw "you must specify a relation's 'target' property";
      }
      this.name = config.name;
      this.target = config.target;
      this.sourceClass = config.sourceClass;
      this.displayName = config.displayName;
      this.inverse = config.inverse;
    }
    Relation.prototype.sourceConstructor = function() {
      var constructor;
      constructor = Knockback.objectReferenceFor(this.sourceClass);
      if (!constructor) {
        throw "sourceClass '" + this.sourceClass + "' is not defined";
      }
      return constructor;
    };
    Relation.prototype.ref = function() {
      var nestedAttrs, source;
      if (this._cached) {
        return this._cached;
      }
      nestedAttrs = this.target.get(this.name);
      source = new (this.sourceConstructor());
      if (source.attributes) {
        this._sourceModel(source, nestedAttrs);
      } else if (source.models) {
        this._sourceCollection(source, nestedAttrs);
      }
      return this._cached = source;
    };
    Relation.prototype._sourceModel = function(source, attrs) {
      source.set(attrs);
      return this.target["" + this.name + "_display"](source);
    };
    Relation.prototype._sourceCollection = function(source, models) {
      var display;
      display = this.target["" + this.name + "_display"];
      source.bind('reset', function() {
        return display(source.models);
      });
      source.bind('remove', function() {
        return display(source.models);
      });
      source.bind('add', function() {
        display(source.models);
        return display.sort(function(m1, m2) {
          if (m1.position) {
            return m1.position() - m2.position();
          }
        });
      });
      if (models) {
        return source.reset(models);
      }
    };
    return Relation;
  })();
  Knockback.Model = Backbone.Model.extend({
    initialize: function(attrs, options) {
      this._bindProxiedMethods();
      this._initRelations(attrs, options);
      return this._initAttributes(attrs, options);
    },
    set: function(attrs, options) {
      if (!Backbone.Model.prototype.set.apply(this, [attrs, options])) {
        return false;
      }
      if (this._relationsInitialized) {
        _.each(attrs, __bind(function(value, key) {
          var relation;
          if (this.relations[key] && this[key]) {
            relation = this[key].ref(true);
            if (relation.set) {
              return relation.set(value, options);
            } else if (relation.reset) {
              return relation.reset(value, options);
            }
          }
        }, this));
      }
      return this;
    },
    includeObservables: function() {
      var obj, objs;
      objs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      obj = _.extend.apply(_, [{}].concat(__slice.call(objs)));
      return _.each(_.functions(obj), __bind(function(method) {
        if (this[method]) {
          throw "dependentObservable would overwrite existing property or method: '" + method + "'";
        }
        return this[method] = ko.dependentObservable(obj[method], this, {
          deferEvaluation: true
        });
      }, this));
    },
    parse: function(response, xhr) {
      var responseAttrs;
      if (this.ajaxPrefix) {
        responseAttrs = response[this.ajaxPrefix];
        _.each(this.relations, __bind(function(className, relationName) {
          if (response[relationName] && !responseAttrs[relationName]) {
            return responseAttrs[relationName] = response[relationName];
          }
        }, this));
        return responseAttrs;
      } else {
        return response;
      }
    },
    _bindProxiedMethods: function() {
      var proxiedFunctions;
      proxiedFunctions = _.select(this.proxied || [], __bind(function(methodName) {
        return _.isFunction(this[methodName]);
      }, this));
      if (proxiedFunctions.length > 0) {
        return _.bindAll.apply(_, [this].concat(__slice.call(proxiedFunctions)));
      }
    },
    _initAttributes: function(attrs, options) {
      var allAttrs, newAttrs;
      this.observables = this.observables || {};
      newAttrs = {};
      this.ID = ko.observable(attrs[this.idAttribute] || null);
      this.bind("change:" + this.idAttribute, __bind(function(model, newId) {
        return this.ID(newId);
      }, this));
      _.each(this.observables, __bind(function(value, key) {
        var safeValue;
        safeValue = attrs[key] ? attrs[key] : value && typeof value === 'object' ? _.clone(value) : value;
        if (!_.isFunction(value)) {
          return newAttrs[key] = safeValue;
        }
      }, this));
      allAttrs = _.extend(newAttrs, attrs);
      _.each(allAttrs, __bind(function(value, key) {
        if (!this._wouldOverwriteExistingProperty(key, !!this.observables[key])) {
          return this._initObservable(key, value);
        }
      }, this));
      _.each(_.functions(this.observables), __bind(function(methodName) {
        if (!this[methodName]) {
          throw "cannot create dependentObservable because model has no method '" + methodName + "'";
        }
        if (Knockback.Model.prototype[methodName]) {
          throw "dependentObservable would override base class method '" + methodName + "'";
        }
        return this[methodName] = ko.dependentObservable(this[methodName], this, {
          deferEvaluation: true
        });
      }, this));
      return this.set(allAttrs, options);
    },
    _initObservable: function(key, value) {
      this[key] = _.isArray(value) ? ko.observableArray(value) : ko.observable(value);
      this.bind("change:" + key, __bind(function(model, newValue) {
        return this[key](newValue);
      }, this));
      return this[key].subscribe(__bind(function(newValue) {
        var h;
        h = {};
        h[key] = newValue;
        return this.set(h);
      }, this));
    },
    _wouldOverwriteExistingProperty: function(key, raiseOnError) {
      if (raiseOnError == null) {
        raiseOnError = true;
      }
      if (key === this.idAttribute) {
        if (raiseOnError) {
          throw "you cannot make the '" + this.idAttribute + "' observable because it is the idAttribute";
        }
        return true;
      } else if (this[key]) {
        if (raiseOnError) {
          throw "observable attribute '" + key + "' would overwrite an existing property or method";
        }
        return true;
      } else {
        return false;
      }
    },
    _initRelations: function(attrs, options) {
      this.relations = this.relations || {};
      _.each(this.relations, __bind(function(className, relationName) {
        var klass, relation;
        if (this[relationName]) {
          throw "relation '" + relationName + "' would overwrite an existing property or method";
        }
        relation = this[relationName] = new Knockback.Relation({
          name: relationName,
          sourceClass: className,
          target: this
        });
        klass = relation.sourceConstructor();
        if (klass.prototype.set) {
          return this["" + relationName + "_display"] = ko.observable({});
        } else if (klass.prototype.reset) {
          return this["" + relationName + "_display"] = ko.observableArray();
        }
      }, this));
      return this._relationsInitialized = true;
    }
  });
  Knockback.Controller = Backbone.Router.extend({
    initialize: function(options) {
      this._wrapped = {};
      return _.each(this.routes, __bind(function(name, pattern) {
        var handler;
        handler = this.handlerForRoute(name);
        if (handler) {
          return handler.callback = this._wrapped[name] = _.wrap(handler.callback, __bind(function(callback, urlFragment) {
            return this.actionWithFilters(name, callback, urlFragment);
          }, this));
        }
      }, this));
    },
    inverseRoutes: function() {
      return this._inverseRoutes || (this._inverseRoutes = _.reduce(this.routes, (__bind(function(memo, name, pattern) {
        memo[name] = this._routeToRegExp(pattern).toString();
        return memo;
      }, this)), {}));
    },
    handlerForRoute: function(routeName) {
      var handlers, routeExp;
      routeExp = this.inverseRoutes()[routeName];
      handlers = Backbone.history ? Backbone.history.handlers : [];
      return _.detect(handlers, function(handler) {
        return handler.route.toString() === routeExp;
      });
    },
    actionWithFilters: function(name, action, urlFragment) {
      _.each(this.filtersForAction(name, 'before'), __bind(function(filter) {
        return filter.apply(this, [urlFragment]);
      }, this));
      action(urlFragment);
      return _.each(this.filtersForAction(name, 'after'), __bind(function(filter) {
        return filter.apply(this, [urlFragment]);
      }, this));
    },
    filtersForAction: function(actionName, filterType) {
      var action_filters, global_filters, methodNames;
      if (!this.inverseRoutes()[actionName]) {
        throw "cannot run filters for non-existent action, '" + actionName + "'";
      }
      this.filters || (this.filters = {});
      global_filters = this.filters[filterType] || [];
      action_filters = this.filters["" + filterType + "_" + actionName] || [];
      methodNames = [].concat(global_filters, action_filters);
      return _.map(methodNames, __bind(function(methodName) {
        return this[methodName];
      }, this));
    }
  });
}).call(this);
