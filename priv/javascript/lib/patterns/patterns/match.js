/* @flow */
import Checks from "./checks";
import * as Types from "./types";

export function buildMatch(pattern: any): Function {

  if(Checks.is_variable(pattern)){
    return resolveVariable(pattern);
  }

  if(Checks.is_wildcard(pattern) || Checks.is_undefined(pattern)){
    return resolveWildcard(pattern);
  }

  if(Checks.is_headTail(pattern)){
    return resolveHeadTail(pattern);
  }

  if(Checks.is_startsWith(pattern)){
    return resolveStartsWith(pattern);
  }

  if(Checks.is_capture(pattern)){
    return resolveCapture(pattern);
  }

  if(Checks.is_bound(pattern)){
    return resolveBound(pattern);
  }

  if(Checks.is_type(pattern)){
    return resolveType(pattern);
  }

  if(Checks.is_array(pattern)){
    return resolveArray(pattern);
  }

  if(Checks.is_number(pattern)){
    return resolvePrimitive(pattern);
  }

  if(Checks.is_string(pattern)){
    return resolvePrimitive(pattern);
  }

  if(Checks.is_boolean(pattern)){
    return resolvePrimitive(pattern);
  }

  if(Checks.is_symbol(pattern)){
    return resolvePrimitive(pattern);
  }

  if(Checks.is_function(pattern)){
    return resolvePrimitive(pattern);
  }

  if(Checks.is_null(pattern)){
    return resolvePrimitive(pattern);
  }

  if(Checks.is_object(pattern)){
    return resolveObject(pattern);
  }

  return function(value: any, args: Array<any>): boolean {
    return false;
  };
}

function resolveBound(pattern: Types.Bound): Function {
  return function(value: any, args: Array<any>): boolean {
    if(typeof value === typeof pattern.value && value === pattern.value){
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolvePrimitive(pattern: any): Function {
  let patternType = typeof pattern;
  let patternValue = pattern;

  return function(value: any): boolean {
    return (typeof value === patternType && value === patternValue) ||
      (Checks.is_number(patternValue) && isNaN(value) && isNaN(patternValue));
  }; 
}

function resolveWildcard(): Function {
  return function(): boolean {
    return true;
  }; 
}

function resolveVariable(): Function {
  return function(value: any, args: Array<any>): boolean {
    args.push(value);
    return true;
  }; 
}

function resolveHeadTail(): Function {
  return function(value: any, args: Array<any>): boolean {
    if(!Checks.is_array(value) || value.length < 2){
      return false;
    }

    const head = value[0];
    const tail = value.slice(1);
    
    args.push(head);
    args.push(tail);

    return true;
  };
}

function resolveCapture(pattern: Types.Capture): Function {
  const matches = buildMatch(pattern.value);

  return function(value: any, args: Array<any>): boolean {
    if(matches(value, args)){
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolveStartsWith(pattern: Types.StartsWith): Function {
  const prefix = pattern.prefix;

  return function(value: any, args: Array<any>): boolean {
    if(Checks.is_string(value) && value.startsWith(prefix)){
      args.push(value.substring(prefix.length));
      return true;
    }

    return false;
  };
}

function resolveType(pattern: Types.Type): Function {
  return function(value: any, args: Array<any>): boolean {
    if(!value instanceof pattern.type){
      return false;
    }

    const matches = buildMatch(pattern.objPattern);
    return matches(value, args) && args.push(value) > 0;
  };
}

function resolveArray(pattern: Array<any>): Function {
  const matches = pattern.map(x => buildMatch(x));

  return function(value: any, args: Array<any>): boolean {
    if(!Checks.is_array(value) || value.length != pattern.length){
      return false;
    }

    return value.every(function(v, i) {
      return matches[i](value[i], args);
    });
  };
}

function resolveObject(pattern: Object): Function {
  let matches = {};

  for(let key of Object.keys(pattern)){
    matches[key] = buildMatch(pattern[key]);
  }

  return function(value: any, args: Array<any>): boolean {
    if(!Checks.is_object(value) || pattern.length > value.length){
      return false;
    }

    for(let key of Object.keys(pattern)){
      if(!(key in value) || !matches[key](value[key], args) ){
        return false;
      }      
    }

    return true;
  };
}