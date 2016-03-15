    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const is_even = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
        return     number % 2 == 0;
      }));
    const parse = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(bin)    {
        let [result] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions,'get_global').parseInt(bin));
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(index_of_dot)    {
        return     new Elixir.Core.Tuple(result,'');
      },function(index_of_dot)    {
        return     index_of_dot < 0;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(index_of_dot)    {
        return     new Elixir.Core.Tuple(result,bin.substring(index_of_dot));
      })).call(this,bin.indexOf('.'));
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     Symbol.for('error');
      })).call(this,Elixir.Core.Functions.call_property(Elixir.Core.Functions,'get_global').isNaN(result));
      }));
    const is_odd = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
        return     number % 2 != 0;
      }));
    const to_char_list = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
        return     to_char_list(number,10);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(number,base)    {
        return     number.toString(base).split(Object.freeze([]));
      }));
    export default {
        is_even,     parse,     is_odd,     to_char_list
  };