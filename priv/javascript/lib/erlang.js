import BitString from './bit_string';
import Immutable from './immutable/immutable';

function atom (_value) {
  return Symbol.for(_value);
}

function list(...args){
  return Immutable.fromJS(args);
}

function tuple(...args){
  return Immutable.fromJS({__tuple__: args });
}

function map(obj){
  return Immutable.fromJS(obj);
}

function bitstring(...args){
  return new BitString(...args);
}

let Erlang = {
  atom: atom,
  tuple: tuple,
  list: list,
  bitstring: bitstring,
  map: map
};

export default Erlang;

