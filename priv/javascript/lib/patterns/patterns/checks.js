/* @flow */

import { Variable, Wildcard, HeadTail, Capture, Type, StartsWith, Bound } from "./types";
import Immutable from '../../immutable/immutable';

function is_number(number){
  return typeof number === 'number';
}

function is_string(string){
  return typeof string === 'string';
}

function is_boolean(bool){
  return typeof bool === 'boolean';
}

function is_symbol(symbol){
  return typeof symbol === 'symbol';
}

function is_null(nil){
  return nil === null;
}

function is_undefined(undef){
  return typeof undef === 'undefined';
}

function is_map(obj){
  return Immutable.Map.isMap(obj);
}

function is_list(list){
  return Immutable.List.isList(list);
}

function is_function(fun){
  return typeof fun === 'function';
}

function is_variable(value){
  return value instanceof Variable;
}

function is_wildcard(value){
  return value instanceof Wildcard;
}

function is_headTail(value){
  return value instanceof HeadTail;
}

function is_capture(value){
  return value instanceof Capture;
}

function is_type(value){
  return value instanceof Type;
}

function is_startsWith(value){
  return value instanceof StartsWith;
}

function is_bound(value){
  return value instanceof Bound;
}

function is_object(obj){
  return typeof obj === 'object';
}

function is_array(arr){
  return Array.isArray(arr);
}

export default {
  is_number,
  is_string,
  is_boolean,
  is_symbol,
  is_null,
  is_undefined,
  is_map,
  is_list,
  is_function,
  is_variable,
  is_wildcard,
  is_headTail,
  is_capture,
  is_type,
  is_startsWith,
  is_bound,
  is_object,
  is_array
};
