/* @flow */

import { buildMatch } from "./match";
import * as Types from "./types";

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
  arity: number;
  optionals: Array<any>;

  constructor(pattern: Array<any>, fn: Function, guard: Function = () => true){
    this.pattern = buildMatch(pattern);
    this.arity = pattern.length;
    this.optionals = getOptionalValues(pattern);
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
      args = fillInOptionalValues(args, processedCase.arity, processedCase.optionals);

      if (processedCase.pattern(args, result) && processedCase.guard.apply(this, result)) {
        return processedCase.fn.apply(this, result);
      }
    }

    console.error('No match for:', args);
    throw new MatchError(args);
  };
}

function getOptionalValues(pattern: Array<any>){
  let optionals = [];

  for(let i = 0; i < pattern.length; i++){
    if(pattern[i] instanceof Types.Variable && pattern[i].default_value != Symbol.for("elixirscript.no_value")){
      optionals.push([i, pattern[i].default_value]);
    }
  }

  return optionals;
}

function fillInOptionalValues(args, arity, optionals){
  if(args.length === arity || optionals.length === 0){
    return args;
  }

  if(args.length + optionals.length < arity){
    return args;
  }

  let numberOfOptionalsToFill = arity - args.length;
  let optionalsToRemove = optionals.length - numberOfOptionalsToFill;

  let optionalsToUse = optionals.slice(optionalsToRemove);

  for(let [index, value] of optionalsToUse){
    args.splice(index, 0, value);
    if(args.length === arity){
      break;
    }
  }

  return args;
}

export function match(pattern: any, expr: any, guard: Function = () => true): Array<any> {
  let result = [];
  let processedPattern = buildMatch(pattern);
  if (processedPattern(expr, result) && guard.apply(this, result)){
    return result;
  }else{
    console.error('No match for:', args);
    throw new MatchError(expr);
  }
}

export function match_no_throw(pattern: any, expr: any, guard: Function = () => true): ?Array<any> {
  let result = [];
  let processedPattern = buildMatch(pattern);
  if (processedPattern(expr, result) && guard.apply(this, result)){
    return result;
  }else{
    return null;
  }
}
