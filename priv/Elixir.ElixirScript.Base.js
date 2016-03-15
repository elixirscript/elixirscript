    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const encode64 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(data)    {
        return     Elixir.Core.b64EncodeUnicode(data);
      }));
    const decode64 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(data)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     Symbol.for('error');
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new Elixir.Core.Tuple(Symbol.for('ok'),decode64__emark__(data));
      })).call(this,Elixir.Core.can_decode64(data));
      }));
    const decode64__emark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(data)    {
        return     Elixir.Core.Functions.call_property(Elixir.Core,'get_global').atob(data);
      }));
    export default {
        encode64,     decode64,     decode64__emark__
  };