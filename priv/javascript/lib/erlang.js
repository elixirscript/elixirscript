import BitString from './bit_string';

//self.mailbox = self.mailbox || {};

function atom (_value) {
  return Symbol.for(_value);
}

function list(...args){
  return Object.freeze(args);
}

function tuple(...args){
  return Object.freeze({__tuple__: Object.freeze(args) });
}

function bitstring(...args){
  if (!(this instanceof bitstring)){
    return new bitstring(...args);
  }

  this.raw_value = function(){
    return Object.freeze(args);
  };

  let _value = Object.freeze(this.process(args));

  this.value = function(){
    return _value;
  };

  this.length = _value.length;

  this.get = function(i){
    return _value[i];
  };

  return this;
}

bitstring.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

bitstring.prototype.toString = function(){
  var i, s = "";
  for (i = 0; i < this.length; i++) {
    if (s !== "") {
      s += ", ";
    }
    s += this.get(i).toString();
  }

  return "<<" + s + ">>";
};

bitstring.prototype.process = function(){
  let processed_values = [];

  var i;
  for (i = 0; i < this.raw_value().length; i++) {
    let processed_value = this['process_' + this.raw_value()[i].type](this.raw_value()[i]);

    for(let attr of this.raw_value()[i].attributes){
      processed_value = this['process_' + attr](processed_value);
    }

    processed_values = processed_values.concat(processed_value);
  }

  return processed_values;
};

bitstring.prototype.process_integer = function(value){
  return value.value;
};

bitstring.prototype.process_float = function(value){
  if(value.size === 64){
    return BitString.float64ToBytes(value.value);
  }else if(value.size === 32){
    return BitString.float32ToBytes(value.value);
  }

  throw new Error('Invalid size for float');
};

bitstring.prototype.process_bitstring = function(value){
  return value.value.value;
};

bitstring.prototype.process_binary = function(value){
  return BitString.toUTF8Array(value.value);
};

bitstring.prototype.process_utf8 = function(value){
  return BitString.toUTF8Array(value.value);
};

bitstring.prototype.process_utf16 = function(value){
  return BitString.toUTF16Array(value.value);
};

bitstring.prototype.process_utf32 = function(value){
  return BitString.toUTF32Array(value.value);
};

bitstring.prototype.process_signed = function(value){
  return (new Uint8Array([value]))[0];
};

bitstring.prototype.process_unsigned = function(value){
  return value;
};

bitstring.prototype.process_native = function(value){
  return value;
};

bitstring.prototype.process_big = function(value){
  return value;
};

bitstring.prototype.process_little = function(value){
  return value.reverse();
};

bitstring.prototype.process_size = function(value){
  return value;
};

bitstring.prototype.process_unit = function(value){
  return value;
};

let Erlang = {
  atom: atom,
  tuple: tuple,
  list: list,
  bitstring: bitstring
};

export default Erlang;

