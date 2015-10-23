import Kernel from "./kernel";
import Patterns from "./patterns/patterns";
import List from "./list";

let Collectable = Kernel.defprotocol({
  into: function(collectable){}
});

export default Collectable;