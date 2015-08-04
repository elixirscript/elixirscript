import Match from './match';

/**
 * @preserve jFun - JavaScript Pattern Matching v0.12
 *
 * Licensed under the new BSD License.
 * Copyright 2008, Bram Stein
 * All rights reserved.
 */
let fun = function(...args) {
  let patterns = args.slice(0).map(function(value, i) {
    let pattern = {
      pattern: Match.buildMatch(value[0]),
      fn: value[1],
      guard: value.length === 3 ? value[2] : function() {
        return true;
      }
    };

    return pattern;
  });

  return function(...inner_args) {
    let value = inner_args.slice(0),
      result = [];

    for (let pattern of patterns) {
      if (pattern.pattern(value, result) && pattern.guard.apply(this, result)) {
        return pattern.fn.apply(this, result);
      }

      result = [];
    }
    // no matches were made so we throw an exception.
    throw 'No match for: ' + value;
  };
};

export default fun;
