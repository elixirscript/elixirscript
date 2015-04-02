const __MODULE_ = Symbol('Logger');

export function debug(message){
  console.debug(message);
}

export function warn(message){
  console.warn(message);
}

export function info(message){
  console.info(message);
}

export function error(message){
  console.error(message);
}

export function log(type, message){
  console.log(message);
}