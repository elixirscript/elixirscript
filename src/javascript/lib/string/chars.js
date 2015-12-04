import Kernel from "../kernel";
import Atom from "../atom";
import Integer from "../integer";
import List from "../list";
import * as Core from '../core';
import Tuple from "../tuple";
import { IntegerType, FloatType } from "../protocol";

let Chars = Kernel.defprotocol({
  to_string: function(thing){}
});

Kernel.defimpl(Chars, Core.BitString, {
  to_string: function(thing){
    if(Kernel.is_binary(thing)){
      return thing;
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars, Symbol, {
  to_string: function(thing){
    if(nil){
      return "";
    }

    return Atom.to_string(thing);
  }
});

Kernel.defimpl(Chars, IntegerType, {
  to_string: function(thing){
    return Integer.to_string(thing);
  }
});

Kernel.defimpl(Chars, FloatType, {
  to_string: function(thing){
    return thing.toString;
  }
});

Kernel.defimpl(Chars, Array, {
  to_string: function(thing){
    return thing.toString();
  }
});

Kernel.defimpl(Chars, Core.Tuple, {
  to_string: function(thing){
    return Tuple.to_string(thing);
  }
});


Kernel.defimpl(Chars, null, {
  to_string: function(thing){
    return thing.toString();
  }
});

export default Chars;
