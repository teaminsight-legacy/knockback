(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  window.Knockback = {};
  Knockback.Model = Backbone.Model.extend({
    initialize: function(attrs, options) {
      this._bindProxiedMethods();
      return this._initAttributes(attrs, options);
    },
    set: function(attrs, options) {
      if (!Backbone.Model.prototype.set.apply(this, [attrs, options])) {
        return false;
      }
      if (!this._relationsInitialized) {
        this._initRelations(attrs, options);
      }
      _.each(attrs, __bind(function(value, key) {
        var related;
        if (this.relations[key] && this[key]) {
          related = this[key];
          if (related.set) {
            return related.set(value, options);
          } else if (related.reset) {
            return related.reset(value, options);
          }
        }
      }, this));
      return this;
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
        return newAttrs[key] = safeValue;
      }, this));
      allAttrs = _.extend(newAttrs, attrs);
      _.each(allAttrs, __bind(function(value, key) {
        if (!this._wouldOverwriteExistingProperty(key, !!this.observables[key])) {
          return this._initObservable(key, value);
        }
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
        var display, klass, relation;
        if (this[relationName]) {
          throw "relation '" + relationName + "' would overwrite an existing property or method";
        }
        klass = this._modelFromClassName(className);
        if (!klass) {
          throw "class '" + className + "' is not defined for the '" + relationName + "' relation";
        }
        relation = this[relationName] = new klass;
        if (relation.set) {
          this["" + relationName + "_display"] = ko.observable(relation);
          return relation.set(attrs[relationName]);
        } else if (relation.reset) {
          display = this["" + relationName + "_display"] = ko.observableArray(relation.models);
          relation.bind('reset', __bind(function() {
            return display(relation.models);
          }, this));
          relation.bind('add', __bind(function() {
            display(relation.models);
            return display.sort(function(m1, m2) {
              if (m1.position) {
                return m1.position() - m2.position();
              }
            });
          }, this));
          relation.bind('remove', __bind(function() {
            return display(relation.models);
          }, this));
          if (attrs[relationName]) {
            return relation.reset(attrs[relationName]);
          }
        }
      }, this));
      return this._relationsInitialized = true;
    },
    _modelFromClassName: function(className) {
      var components, identifier, namespace;
      namespace = window;
      components = className.split('.');
      while (identifier = components.shift()) {
        namespace = namespace[identifier];
      }
      return namespace;
    }
  });
}).call(this);
