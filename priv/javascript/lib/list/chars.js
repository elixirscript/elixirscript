import Kernel from "../kernel";
import Atom from "../atom";
import Integer from "../integer";
import List from "../list";
import String from "../string";

let Chars = Kernel.defprotocol({
  to_char_list: function(thing){}
});

Kernel.defimpl(Chars, Kernel.is_bitstring, {
  to_char_list: function(thing){
    if(Kernel.is_binary(thing)){
      return String.to_char_list(thing);
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars, Kernel.is_atom, {
  to_char_list: function(thing){
    return Atom.to_char_list(thing);
  }
});

Kernel.defimpl(Chars, Kernel.is_integer, {
  to_char_list: function(thing){
    return Integer.to_char_list(thing);
  }
});


Kernel.defimpl(Chars, Kernel.is_list, {
  to_char_list: function(thing){
    return thing;
  }
});

export default Chars;