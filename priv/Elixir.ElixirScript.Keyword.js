    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const do_has_key__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard()],function()    {
        return     false;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(kw,key)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.wildcard()]
  })],function(the_key)    {
        return     true;
      },function(the_key)    {
        return     the_key == key;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     do_has_key__qmark__(Elixir$ElixirScript$Kernel.tl(kw),key);
      })).call(this,Elixir$ElixirScript$Kernel.hd(kw));
      }));
    const do_get = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(kw,key)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
  })],function(kw_key,value)    {
        return     value;
      },function(kw_key,value)    {
        return     kw_key == key;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     do_get(Elixir$ElixirScript$Kernel.tl(kw),key);
      })).call(this,Elixir$ElixirScript$Kernel.hd(kw));
      }));
    const has_key__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(kw,key)    {
        return     do_has_key__qmark__(kw,key);
      }));
    const get = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(kw,key)    {
        return     get(kw,key,null);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(kw,key,default_value)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     do_get(kw,key);
      }),Elixir.Core.Patterns.make_case([false],function()    {
        return     default_value;
      })).call(this,has_key__qmark__(kw,key));
      }));
    export default {
        has_key__qmark__,     get
  };