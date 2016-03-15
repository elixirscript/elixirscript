    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$ElixirScript$List from './Elixir.ElixirScript.List';
    const Elixir$ElixirScript$MapSet = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.MapSet'),     [Symbol.for('set')]: Object.freeze([])
  });
    const __new__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
        return     Elixir$ElixirScript$MapSet.Elixir$ElixirScript$MapSet.create(Object.freeze({}));
      }));
    const equal__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1,set2)    {
        return     set1 === set2;
      }));
    const disjoint__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1,set2)    {
        return     size(intersection(set1,set2)) == 0;
      }));
    const member__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set,term)    {
        return     Elixir.Core.Functions.call_property(set,'set').indexOf(term) >= 0;
      }));
    const do_subset__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard()],function()    {
        return     true;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1_list,set2)    {
        let [term] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir$ElixirScript$Kernel.hd(set1_list));
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
        return     false;
      }),Elixir.Core.Patterns.make_case([true],function()    {
        return     do_subset__qmark__(Elixir$ElixirScript$Kernel.tl(set1_list),set2);
      })).call(this,member__qmark__(set2,term));
      }));
    const subset__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1,set2)    {
        return     do_subset__qmark__(to_list(set1),set2);
      }));
    const intersection = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1,set2)    {
        return     do_intersection(to_list(set1),set2,__new__());
      }));
    const do_intersection = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()],function(intersection_set)    {
        return     intersection_set;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1_list,set2,intersection_set)    {
        let [term] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir$ElixirScript$Kernel.hd(set1_list));
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
        return     do_intersection(Elixir$ElixirScript$Kernel.tl(set1_list),set2,intersection_set);
      }),Elixir.Core.Patterns.make_case([true],function()    {
        return     do_intersection(Elixir$ElixirScript$Kernel.tl(set1_list),set2,Elixir.Core.SpecialForms.map_update(intersection_set,Object.freeze({
        [Symbol.for('set')]: Elixir.Core.Functions.call_property(intersection_set,'set').concat(Object.freeze([term]))
  })));
      })).call(this,member__qmark__(set2,term));
      }));
    const union = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1,set2)    {
        return     Elixir.Core.SpecialForms.map_update(set1,Object.freeze({
        [Symbol.for('set')]: Elixir.Core.Functions.call_property(set1,'set').concat(Elixir.Core.Functions.call_property(set2,'set'))
  }));
      }));
    const size = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(set)    {
        return     Elixir$ElixirScript$Kernel.length(Elixir.Core.Functions.call_property(set,'set'));
      }));
    const do_difference = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()],function(difference_set)    {
        return     difference_set;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1_list,set2,difference_set)    {
        let [term] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir$ElixirScript$Kernel.hd(set1_list));
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     do_difference(Elixir$ElixirScript$Kernel.tl(set1_list),set2,difference_set);
      }),Elixir.Core.Patterns.make_case([false],function()    {
        return     do_difference(Elixir$ElixirScript$Kernel.tl(set1_list),set2,Elixir.Core.SpecialForms.map_update(difference_set,Object.freeze({
        [Symbol.for('set')]: Elixir.Core.Functions.call_property(difference_set,'set').concat(Object.freeze([term]))
  })));
      })).call(this,member__qmark__(set2,term));
      }));
    const __delete__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set,term)    {
        return     Elixir.Core.SpecialForms.map_update(set,Object.freeze({
        [Symbol.for('set')]: Elixir$ElixirScript$List.remove(Elixir.Core.Functions.call_property(set,'set'),term)
  }));
      }));
    const difference = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set1,set2)    {
        return     do_difference(to_list(set1),set2,__new__());
      }));
    const to_list = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(set)    {
        return     Elixir.Core.Functions.call_property(set,'set');
      }));
    const put = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(set,term)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
        return     Elixir.Core.SpecialForms.map_update(set,Object.freeze({
        [Symbol.for('set')]: Elixir.Core.Functions.call_property(set,'set').concat(term)
  }));
      }),Elixir.Core.Patterns.make_case([true],function()    {
        return     set;
      })).call(this,member__qmark__(set,term));
      }));
    export default {
        Elixir$ElixirScript$MapSet,     __new__,     equal__qmark__,     disjoint__qmark__,     member__qmark__,     do_subset__qmark__,     subset__qmark__,     intersection,     do_intersection,     union,     size,     do_difference,     __delete__,     difference,     to_list,     put
  };