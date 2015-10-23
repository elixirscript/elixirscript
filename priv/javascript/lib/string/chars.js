import Kernel from "../kernel";
import Atom from "../atom";
import Integer from "../integer";
import List from "../list";
import Tuple from "../tuple";

let Chars = Kernel.defprotocol({
  to_string: function(thing){}
});

Kernel.defimpl(Chars, Kernel.is_bitstring, {
  to_string: function(thing){
    if(Kernel.is_binary(thing)){
      return thing;
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars, Kernel.is_atom, {
  to_string: function(thing){
    if(nil){
      return "";
    }

    return Atom.to_string(thing);
  }
});

Kernel.defimpl(Chars, Kernel.is_integer, {
  to_string: function(thing){
    return Integer.to_string(thing);
  }
});

Kernel.defimpl(Chars, Kernel.is_float, {
  to_string: function(thing){
    return thing.toString;
  }
});

Kernel.defimpl(Chars, Kernel.is_list, {
  to_string: function(thing){
    return thing.toString();
  }
});

Kernel.defimpl(Chars, Kernel.is_tuple, {
  to_string: function(thing){
    return Tuple.to_string(thing);
  }
});

export default Chars;