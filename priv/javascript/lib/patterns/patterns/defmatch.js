/* @flow */

import { buildMatch } from "./match";
import Immutable from '../../immutable/immutable';

export class MatchError extends Error {
  constructor(message) {
    super();
    this.message = message; 
    this.stack = (new Error()).stack;
    this.name = this.constructor.name;
  }
}    

export function defmatch(...cases){
  cases = Immutable.fromJS(cases);

  const processedCases = cases.map(x => {
    return Immutable.Map({
      pattern: buildMatch(x.get("pattern")),
      guard: x.get("guard") || function(){ return true; },
      fn: x.get("fn")
    });
  });

  return function(...args) {
    args = Immutable.fromJS(args);

    for (let processedCase of processedCases) {
      let result = [];
      if (processedCase.get("pattern")(args, result) && processedCase.get("guard").apply(this, result)) {
        return processedCase.get("fn").apply(this, result);
      }
    }

    throw new MatchError('No match for: ' + args.toString());
  };
}

export function match(pattern, expr, guard = () => true){
  pattern = Immutable.fromJS(pattern);
  expr = Immutable.fromJS(expr);

  let result = [];
  let processedPattern = buildMatch(pattern);
  if (processedPattern(expr, result) && guard.apply(this, result)){
    return result;
  }else{
    throw new MatchError('No match for: ' + expr.toString());
  }
}