import * as Core from './core';

//https://github.com/airportyh/protomorphism
class Protocol{
  constructor(spec){
    this.registry = new Map();
    this.fallback = null;

    for (let funName in spec){
      this[funName] = createFun(funName).bind(this);
    }

    function createFun(funName){

      return function(...args) {
        let thing = args[0];
        let fun = null;

        if(Number.isInteger(thing) && this.hasImplementation(Core.IntegerType)){
          fun = this.registry.get(Core.IntegerType)[funName];
        }else if(typeof thing === "number" && !Number.isInteger(thing) && this.hasImplementation(Core.FloatType)){
          fun = this.registry.get(Core.FloatType)[funName];
        }else if(this.hasImplementation(thing)){
          fun = this.registry.get(thing.constructor)[funName];
        }else if(this.fallback){
          fun = this.fallback[funName];
        }

        if(fun != null){
          let retval = fun.apply(this, args);
          return retval;
        }

        throw new Error("No implementation found for " + thing);
      }
    }
  }

  implementation(type, implementation){
    if(type === null){
      this.fallback = implementation;
    }else{
      this.registry.set(type, implementation);
    }
  }

  hasImplementation(thing) {
    return this.registry.has(thing.constructor);
  }
}


export default Protocol;
