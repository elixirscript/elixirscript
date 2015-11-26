import Kernel from "./kernel";

let Enumerable = Kernel.defprotocol({
  count: function(collection){},
  member_qmark__: function(collection, value){},
  reduce: function(collection, acc, fun){}
});

export default Enumerable;