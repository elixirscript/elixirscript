import funcy from '../funcy';
import Type from './type';

/**
 * @preserve JUnify - Unification JavaScript Library v1.0.1
 *
 * Licensed under the revised BSD License.
 * Copyright 2008-2012 Bram Stein
 * All rights reserved.
 */
function occurs(variable, pattern) {
  let i, key;

  if (Type.isVariable(pattern) && variable.get_name() === pattern.get_name()) {
    return true;
  } else if (Type.isVariable(pattern) || Type.isAtom(pattern)) {
    return false;
  } else if (Type.isArray(pattern)) {
    for (i = 0; i < pattern.length; i += 1) {
      if (occurs(variable, pattern[i])) {
        return true;
      }
    }
    return false;
  } else if (Type.isObject(pattern)) {
    for (key in pattern) {
      if (pattern.hasOwnProperty(key)) {
        if (occurs(variable, pattern[key])) {
          return true;
        }
      }
    }
    return false;
  }
}

function get_binding(variable, substitution) {
  let binding;

  if (substitution.hasOwnProperty(variable.get_name())) {
    binding = {};
    binding[variable.get_name()] = substitution[variable.get_name()];
  }
  return binding;
}

function add_substitution(variable, pattern, substitution) {
  substitution[variable.get_name()] = pattern;
  return substitution;
}

function match_var(variable, pattern, substitution) {
  let binding;

  // don't match a variable with another (or itself)
  if (Type.isVariable(pattern) && Type.isVariable(variable)) {
    return false;
  }
  // if the variable or pattern is a wildcard we return without binding
  else if (Type.isWildcard(variable) || Type.isWildcard(pattern)) {
    return substitution;
  }
  // if the variable has a type which doesn't match the type of the pattern,
  // we return false (no match)
  else if (variable.get_type() !== false && variable.get_type() !== pattern.constructor) {
    return false;
  }
  // otherwise we try to bind the pattern to the variable
  else {
    binding = get_binding(variable, substitution);
    // if it's already bound we call unify again to resolve any variables inside
    // the binding.
    if (binding) {
      return unify_aux(binding[variable.get_name()], pattern, substitution);
    }
    if (occurs(variable, pattern)) {
      return false;
    } else {
      return add_substitution(variable, pattern, substitution);
    }
  }
}

function unify_object(pattern1, pattern2, substitution) {
  let has_var, key, c1, c2;

  // if the two objects have different constructors we also consider
  // them unequal. This prevents for example:
  //   Point(x, y) -> {x: x, y: y} and Vertex(x, y) -> {x: x, y: y}
  // to be regarded as the same object.
  if ((pattern1.constructor && pattern2.constructor) && pattern1.constructor !== pattern2.constructor) {
    return false;
  }

  has_var = pattern2.hasOwnProperty("_");
  c1 = c2 = 0;

  for (key in pattern1) {
    if (pattern1.hasOwnProperty(key)) {
      if (key !== "_") {
        if (pattern2.hasOwnProperty(key)) {
          if (unify_aux(pattern1[key], pattern2[key], substitution) === false) {
            return false;
          }
        } else if (!pattern2.hasOwnProperty(key) && !has_var) {
          return false;
        }
      }
      c1 += 1;
    }
  }

  has_var = pattern1.hasOwnProperty("_");

  for (key in pattern2) {
    if (pattern2.hasOwnProperty(key)) {
      if (key !== "_") {
        if (pattern1.hasOwnProperty(key)) {
          if (unify_aux(pattern1[key], pattern2[key], substitution) === false) {
            return false;
          }
        } else if (!pattern1.hasOwnProperty(key) && !has_var) {
          return false;
        }
      }
      c2 += 1;
    }
  }

  if (c1 === 0 && c2 === 0) {
    return substitution;
  }
  if (c1 === 0 || c2 === 0) {
    return false;
  }
  return substitution;
}

function unify_array(pattern1, pattern2, substitution) {
  let i;
  if (pattern1.length === pattern2.length) {
    for (i = 0; i < pattern1.length; i += 1) {
      if (unify_aux(pattern1[i], pattern2[i], substitution) === false) {
        return false;
      }
    }
  } else {
    return false;
  }
  return substitution;
}

function unify_aux(pattern1, pattern2, substitution) {
  if (substitution === false) {
    return false;
  } else if (Type.isVariable(pattern1) || Type.isWildcard(pattern1)) {
    return match_var(pattern1, pattern2, substitution);
  } else if (Type.isVariable(pattern2) || Type.isWildcard(pattern2)) {
    return match_var(pattern2, pattern1, substitution);
  } else if (Type.isAtom(pattern1)) {
    if (pattern1 === pattern2) {
      return substitution;
    } else {
      return false;
    }
  } else if (Type.isAtom(pattern2)) {
    return false;
  } else if (Type.isArray(pattern1) && Type.isArray(pattern2)) {
    return unify_array(pattern1, pattern2, substitution);
  } else if (Type.isObject(pattern1) && Type.isObject(pattern2)) {
    return unify_object(pattern1, pattern2, substitution);
  }
}

function visit_pattern(pattern, visitor) {
  let key, i, value;

  if (Type.isVariable(pattern)) {
    return (visitor.hasOwnProperty('variable') && visitor.variable(pattern)) || pattern;
  } else if (Type.isWildcard(pattern)) {
    return (visitor.hasOwnProperty('wildcard') && visitor.wildcard()) || pattern;
  } else if (Type.isFunction(pattern)) {
    return (visitor.hasOwnProperty('func') && visitor.func(pattern)) || pattern;
  } else if (Type.isObject(pattern)) {
    for (key in pattern) {
      if (pattern.hasOwnProperty(key) && visitor.hasOwnProperty('object') && key !== funcy.wildcard) {
        value = visitor.object(key, pattern[key]);
        pattern[key] = visit_pattern(value, visitor);
      } else if (pattern.hasOwnProperty(key) && key !== funcy.wildcard) {
        pattern[key] = visit_pattern(pattern[key], visitor);
      }
    }
    return pattern;
  } else if (Type.isArray(pattern)) {
    for (i = 0; i < pattern.length; i += 1) {
      pattern[i] = visit_pattern(pattern[i], visitor);
    }
    return pattern;
  } else {
    return (visitor.hasOwnProperty('atom') && visitor.atom(pattern)) || pattern;
  }
}

let Unification = {
  unify: function(pattern1, pattern2) {
    return unify_aux(pattern1, pattern2, {});
  },
  visit_pattern: function(pattern, visitor) {
    return visit_pattern(pattern, visitor);
  }
};

export default Unification;
