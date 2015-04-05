let Logger = {
  __MODULE_: Symbol('Logger'),

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
    console.log(message);
  }
}
