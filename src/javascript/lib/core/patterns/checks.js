/* @flow */

import { Variable, Wildcard, HeadTail, Capture, Type, StartsWith, Bound } from "./types";

function is_number(value: any): boolean {
  return typeof value === 'number';
}

function is_string(value: any): boolean{
  return typeof value === 'string';
}

function is_boolean(value: any): boolean {
  return typeof value === 'boolean';
}

function is_symbol(value: any): boolean {
  return typeof value === 'symbol';
}

function is_null(value: any): boolean {
  return value === null;
}

function is_undefined(value: any): boolean {
  return typeof value === 'undefined';
}

function is_function(value: any): boolean {
  return Object.prototype.toString.call(value) == '[object Function]';
}

function is_variable(value: any): boolean {
  return value instanceof Variable;
}

function is_wildcard(value: any): boolean {
  return value instanceof Wildcard;
}

function is_headTail(value: any): boolean {
  return value instanceof HeadTail;
}

function is_capture(value: any): boolean {
  return value instanceof Capture;
}

function is_type(value: any): boolean {
  return value instanceof Type;
}

function is_startsWith(value: any): boolean {
  return value instanceof StartsWith;
}

function is_bound(value: any): boolean {
  return value instanceof Bound;
}

function is_object(value: any): boolean {
  return typeof value === 'object';
}

function is_array(value: any): boolean {
  return Array.isArray(value);
}

export default {
  is_number,
  is_string,
  is_boolean,
  is_symbol,
  is_null,
  is_undefined,
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
