import fun from './funcy/fun';
import unification from './funcy/unification';

export default {
  fun: fun,
  unify: unification.unify,
  parameter: function(name, orElse) {
    function Parameter(n, o) {
      this.name = n;
      this.orElse = o;
    }
    return new Parameter(name, orElse);
  },

  capture: function(pattern) {
    function Capture(p) {
      this.pattern = p;
    }
    return new Capture(pattern);
  },

  startsWith: function(substr) {
    function StartsWith(s) {
      this.substr = s;
    }

    return new StartsWith(substr);
  },

  wildcard: (function() {
    function Wildcard() {
    }
    return new Wildcard();
  }()),

  variable: function(value, type) {
    return {
      is_variable: function() {
        return true;
      },
      get_name: function() {
        return value;
      },
      get_type: function() {
        return type || false;
      }
    };
  },

  headTail: (function() {
    function HeadTail() {
    }
    return new HeadTail();
  }())
};
