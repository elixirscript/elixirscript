import Atom from './atom';

let Logger = {
  __MODULE_: [Atom('Logger')],

  debug: function(message){
    console.debug(message);
  },

  warn: function(message){
    console.warn(message);
  },

  info: function(message){
    console.info(message);
  },

  error: function(message){
    console.error(message);
  },

  log: function(type, message){
    if(type.value === "warn"){
      console.warn(message);
    }else if(type.value === "debug"){
      console.debug(message);
    }else if(type.value === "info"){
      console.info(message);
    }else if(type.value === "error"){
      console.error(message);
    }else{
      throw new ArgumentError("invalid type");
    }
  }
}

export default Logger;