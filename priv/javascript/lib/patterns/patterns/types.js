/* @flow */
import Immutable from '../../immutable/immutable';


export class Variable {
  constructor(name = null) {
    this.name = name;
  }
}

export class Wildcard {
  constructor() {
  }
}

export class StartsWith {
  constructor(prefix) {
    this.prefix = prefix;
  }
}

export class Capture {
  constructor(value) {
    this.value = Immutable.fromJS(value);
  }
}

export class HeadTail {
  constructor() {
  }
}

export class Type {
  constructor(type, objPattern = {}) {
    this.type = Immutable.fromJS(type);
    this.objPattern = Immutable.fromJS(objPattern);
  }
}

export class Bound {
  constructor(value) {
    this.value = value;
  }
}

export function variable(name = null){
  return new Variable(name);
}

export function wildcard(){
  return new Wildcard();
}

export function startsWith(prefix){
  return new StartsWith(prefix);
}

export function capture(value){
  return new Capture(value);
}

export function headTail(){
  return new HeadTail();
}

export function type(type, objPattern = {}){
  return new Type(type, objPattern);
}
