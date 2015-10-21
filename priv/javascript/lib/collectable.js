import Kernel from "./kernel";
import Patterns from "./patterns/patterns";
import List from "./list";

let Collectable = Kernel.defprotocol({
  into: function(collectable){}
});

Kernel.defimpl(Collectable, Kernel.is_list, {
  into: function(collectable){
    let original_value = Kernel.SpecialForms.list();

    let fn = Patterns.defmatch(
      Patterns.make_case(
        [Patterns.parameter(), Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("cont"), Patterns.parameter())], 
        function(list, x){
          return List.append(list, x);
      }),
      Patterns.make_case(
        [Patterns.parameter(), Kernel.SpecialForms.atom("done")], 
        function(list){
          return List.concat(collectable, list);
      }),
      Patterns.make_case(
        [Patterns.wildcard(), Kernel.SpecialForms.atom("halt")], 
        function(){
          return Kernel.SpecialForms.atom("ok");
      })
    );


    return Kernel.SpecialForms.tuple(original_value, fn);
  }
});


Kernel.defimpl(Collectable, Kernel.is_map, {
  into: function(collectable){

    let fn = Patterns.defmatch(
      Patterns.make_case(
        [Patterns.parameter(), Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("cont"), Kernel.SpecialForms.tuple(Patterns.parameter(), Patterns.parameter()))], 
        function(map, key, value){
          return Kernel.SpecialForms.map_update(map, { [key]: value });
      }),
      Patterns.make_case(
        [Patterns.parameter(), Kernel.SpecialForms.atom("done")], 
        function(map){
          return map;
      }),
      Patterns.make_case(
        [Patterns.wildcard(), Kernel.SpecialForms.atom("halt")], 
        function(){
          return Kernel.SpecialForms.atom("ok");
      })
    );


    return Kernel.SpecialForms.tuple(collectable, fn);
  }
});

export default Collectable;