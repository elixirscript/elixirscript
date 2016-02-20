/* @flow */

import { buildMatch } from "./match";

export class MatchError extends Error {
  constructor(arg: any) {
    super();

    if(typeof arg === 'symbol'){
      this.message = 'No match for: ' + arg.toString();
    } else if(Array.isArray(arg)){
      let mappedValues = arg.map((x) => x.toString());
      this.message = 'No match for: ' + mappedValues;
    }else{
      this.message = 'No match for: ' + arg;
    }

    this.stack = (new Error()).stack;
    this.name = this.constructor.name;
  }
}


export class Case {
  pattern: Function;
  fn: Function;
  guard: Function;

  constructor(pattern: Array<any>, fn: Function, guard: Function = () => true){
    this.pattern = buildMatch(pattern);
    this.fn = fn;
    this.guard = guard;
  }
}

export function make_case(pattern: Array<any>, fn: Function, guard: Function = () => true): Case {
  return new Case(pattern, fn, guard);
}

export function defmatch(...cases: Array<Case>): Function {
  return function(...args: Array<any>): any {
    for (let processedCase of cases) {
      let result = [];
      if (processedCase.pattern(args, result) && processedCase.guard.apply(this, result)) {
        return processedCase.fn.apply(this, result);
      }
    }

    throw new MatchError(args);
  };
}

export function match(pattern: any, expr: any, guard: Function = () => true): Array<any> {
  let result = [];
  let processedPattern = buildMatch(pattern);
  if (processedPattern(expr, result) && guard.apply(this, result)){
    return result;
  }else{
    throw new MatchError(expr);
  }
}

export function match_no_throw(pattern: any, expr: any, guard: Function = () => true): ?Array<any> {
  try{
    return match(pattern, expr, guard);
  }catch(e){
    if(e instanceof MatchError || e.message.startsWith('No match for:')){
      return null;
    }

    throw e;
  }
}

export function patternMap(collection: Array<any>, pattern: any, fun: Function, guard: Function = () => true): Array<any> {
  let ret = [];

  for(let elem of collection){
    try{
      let result = fun.apply(this, match(pattern, elem, guard));
      ret = ret.concat(result);
    }catch(e){
    if(!(e instanceof MatchError)){
        throw e;
      }
    }
  }

  return ret;
}
