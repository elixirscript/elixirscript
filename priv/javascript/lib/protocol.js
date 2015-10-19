//https://github.com/airportyh/protomorphism
class Protocol{
  constructor(spec){
    this.registry = [];
    this.fallback = null;

    for (let funName in spec){
      this[funName] = createFun(funName).bind(this);
    }

    function createFun(funName){

      return function(...args) {
        let thing = args[0];

        for([check, implementation] of this.registry){
          if(check(thing)){
            let fun = implementation[funName];
            let retval = fun.apply(this, args);
            return retval;            
          }
        }

        if(this.fallback){
          let fun = fallback;
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
      this.registry.push([type, implementation]);
    }
  }
}


function defprotocol(spec){
  return new Protocol(spec);
}


export default {
  defprotocol
}