import Match from './match';
import MatchError from './match_error';

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
    throw new MatchError('No match for: ' + value);
  };
};

fun.bind = function(pattern, expr){
  let result = [];
  let processedPattern = Match.buildMatch(pattern);
  if (processedPattern(expr, result)){
    return result;
  }else{
    throw new MatchError('No match for: ' + expr);
  }
};


fun.parameter = function(name, orElse) {
  function Parameter(n, o) {
    this.name = n;
    this.orElse = o;
  }
  return new Parameter(name, orElse);
};

fun.capture = function(pattern) {
  function Capture(p) {
    this.pattern = p;
  }
  return new Capture(pattern);
};

fun.startsWith = function(substr) {
  function StartsWith(s) {
    this.substr = s;
  }

  return new StartsWith(substr);
};

fun.wildcard = (function() {
  function Wildcard() {
  }
  return new Wildcard();
}());

fun.headTail = (function() {
  function HeadTail() {
  }
  return new HeadTail();
}());

fun.bound = function(value) {
  function Bound(v) {
    this.value = v;
  }

  return new Bound(value);
};

export default fun;
