import Kernel from "./kernel";

let Inspect = Kernel.defprotocol({
  inspect: function(thing, opts){}
});

Kernel.defimpl(Inspect, null, {
  inspect: function(thing, opts){
    return thing.toString();
  }
});

export default Inspect;