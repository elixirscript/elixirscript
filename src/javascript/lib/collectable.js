import Kernel from "./kernel";
import List from "./list";

let Collectable = Kernel.defprotocol({
  into: function(collectable){}
});

export default Collectable;
