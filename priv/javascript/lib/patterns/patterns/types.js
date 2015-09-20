/* @flow */
export class Variable {
  name: ?string;

  constructor(name: ?string = null) {
    this.name = name;
  }
}

export class Wildcard {
  constructor() {
  }
}

export class StartsWith {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }
}

export class Capture {
  value: any;

  constructor(value: any) {
    this.value = value;
  }
}

export class HeadTail {
  constructor() {
  }
}

export class Type {
  type: any;
  objPattern: Object;

  constructor(type: any, objPattern: Object = {}) {
    this.type = type
    this.objPattern = objPattern
  }
}

export class Bound {
  value: any;

  constructor(value: any) {
    this.value = value;
  }
}

export function variable(name: ?string = null): Variable {
  return new Variable(name);
}

export function wildcard(): Wildcard {
  return new Wildcard();
}

export function startsWith(prefix: string): StartsWith {
  return new StartsWith(prefix);
}

export function capture(value: any): Capture {
  return new Capture(value);
}

export function headTail(): HeadTail {
  return new HeadTail();
}

export function type(type: any, objPattern: Object = {}): Type {
  return new Type(type, objPattern);
}

export function bound(value: any): Bound {
  return new Bound(value);
}
