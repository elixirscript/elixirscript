    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const Elixir$ElixirScript$Range = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.Range'),     [Symbol.for('first')]: null,     [Symbol.for('last')]: null
  });
    const __new__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(first,last)    {
        return     Elixir$ElixirScript$Range.Elixir$ElixirScript$Range.create(Object.freeze({
        [Symbol.for('first')]: first,     [Symbol.for('last')]: last
  }));
      }));
    const range__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir$ElixirScript$Range.Elixir$ElixirScript$Range,{})],function()    {
        return     true;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     false;
      }));
    export default {
        Elixir$ElixirScript$Range,     __new__,     range__qmark__
  };