/* @flow */

import Checks from "./checks";
import * as Types from "./types";
import { buildMatch } from "./match";
import Tuple from '../../tuple';

function resolveTuple(pattern: any): Function {
  let matches = [];

  for(let elem of pattern){
    matches.push(buildMatch(elem));
  }

  return function(value: any, args: Array<any>): boolean {
    if(!Checks.is_tuple(value) || value.count() != pattern.count()){
      return false;
    }


    return value.values.every(function(v, i) {
      return matches[i](value.get(i), args);
    });
  };
}

function resolveSymbol(pattern: any): Function {
  return function(value: any): boolean {
    return Checks.is_symbol(value) && value === pattern;
  }; 
}

function resolveString(pattern: any): Function {
  return function(value: any): boolean {
    return Checks.is_string(value) && value === pattern
  }; 
}

function resolveNumber(pattern: any): Function {
  return function(value: any): boolean {
    return Checks.is_number(value) && value === pattern;
  }; 
}

function resolveBoolean(pattern: any): Function {
  return function(value: any): boolean {
    return Checks.is_boolean(value) && value === pattern
  }; 
}

function resolveFunction(pattern: any): Function {
  return function(value: any): boolean {
    return Checks.is_function(value) && value === pattern
  }; 
}

function resolveNull(pattern: any): Function {
  return function(value: any): boolean {
    return Checks.is_null(value);
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

function resolveNoMatch(): Function {
  return function(): boolean {
    return false;
  }
}

export default {
  resolveBound,
  resolveWildcard,
  resolveVariable,
  resolveHeadTail,
  resolveCapture,
  resolveStartsWith,
  resolveType,
  resolveArray,
  resolveObject,
  resolveNoMatch,
  resolveSymbol,
  resolveString,
  resolveNumber,
  resolveBoolean,
  resolveFunction,
  resolveNull,
  resolveTuple
}