import Kernel from "./kernel";

let Inspect = Kernel.defprotocol({
  inspect: function(thing, opts){}
});

export default Inspect;