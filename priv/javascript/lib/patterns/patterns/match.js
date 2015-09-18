/* @flow */

import Checks from "./checks";
import Immutable from '../../immutable/immutable';

export function buildMatch(pattern){

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

  if(Checks.is_list(pattern)){
    return resolveList(pattern);
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

  if(Checks.is_map(pattern)){
    return resolveMap(pattern);
  }

  if(Checks.is_array(pattern)){
    return resolveArray(pattern);
  }

  if(Checks.is_object(pattern)){
    return resolveObject(pattern);
  }

  return false;
}

function resolveBound(pattern){
  return function(value, args) {
    if(typeof value === typeof pattern.value && value === pattern.value){
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolvePrimitive(pattern){
  let patternType = typeof pattern;
  let patternValue = pattern;

  return function(value) {
    return (typeof value === patternType && value === patternValue) ||
      (Checks.is_number(patternValue) && isNaN(value) && isNaN(patternValue));
  }; 
}

function resolveWildcard(){
  return function() {
    return true;
  }; 
}

function resolveVariable(){
  return function(value, args) {
    args.push(value);
    return true;
  }; 
}

function resolveHeadTail(){
  return function(value, args) {
    if(!Checks.is_list(value) || value.count() < 2){
      return false;
    }

    const [head, ...tail] = value;
    
    args.push(head);
    args.push(tail);

    return true;
  };
}

function resolveCapture(pattern){
  const matches = buildMatch(pattern.value);

  return function(value, args){
    if(matches(value, args)){
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolveStartsWith(pattern){
  const prefix = pattern.prefix;

  return function(value, args){
    if(Checks.is_string(value) && value.startsWith(prefix)){
      args.push(value.substring(prefix.length));
      return true;
    }

    return false;
  };
}

function resolveType(pattern){
  return function(value, args){
    if(!value instanceof pattern.type){
      return false;
    }

    const matches = buildMatch(pattern.objPattern.toJS());
    return matches(value, args) && args.push(value) > 0;
  };
}

function resolveList(pattern){
  const matches = pattern.map(x => buildMatch(x));

  return function(value, args) {
    if(!Checks.is_list(value) || value.count() != pattern.count()){
      return false;
    }

    return value.every(function(v, i) {
      return matches.get(i)(value.get(i), args);
    });
  };
}

function resolveMap(pattern){
  let matches = Immutable.Map();

  for(let key of pattern.keys()){
    matches = matches.set(key, buildMatch(pattern.get(key)));
  }

  return function(value, args){
    if(!Checks.is_map(value) || pattern.count() > value.count()){
      return false;
    }

    for(let key of pattern.keys()){
      if(!value.has(key) || !matches.get(key)(value.get(key), args) ){
        return false;
      }      
    }

    return true;
  };
}

function resolveArray(pattern){
  const matches = pattern.map(x => buildMatch(x));

  return function(value, bindings) {
    if(!Checks.is_array(value) || value.length != pattern.length){
      return false;
    }

    return value.every(function(v, i) {
      return matches[i](value[i], bindings);
    });
  };
}

function resolveObject(pattern){
  let matches = {};

  for(let key of Object.keys(pattern)){
    matches[key] = buildMatch(pattern[key]);
  }

  return function(value, bindings){
    if(!Checks.is_object(value) || pattern.length > value.length){
      return false;
    }

    for(let key of Object.keys(pattern)){
      if(!(key in value) || !matches[key](value[key], bindings) ){
        return false;
      }      
    }

    return true;
  };
}