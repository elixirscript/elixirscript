import Kernel from "../kernel";
import Atom from "../atom";
import Integer from "../integer";
import String from "../string";
import * as Core from '../core';

let Chars = Kernel.defprotocol({
  to_char_list: function(thing){}
});

Kernel.defimpl(Chars, Core.BitString, {
  to_char_list: function(thing){
    if(Kernel.is_binary(thing)){
      return String.to_char_list(thing);
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars, Symbol, {
  to_char_list: function(thing){
    return Atom.to_char_list(thing);
  }
});

Kernel.defimpl(Chars, Core.Integer, {
  to_char_list: function(thing){
    return Integer.to_char_list(thing);
  }
});


Kernel.defimpl(Chars, Array, {
  to_char_list: function(thing){
    return thing;
  }
});

export default Chars;
