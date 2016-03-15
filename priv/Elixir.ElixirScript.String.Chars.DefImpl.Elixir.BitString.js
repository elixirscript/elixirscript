    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const to_string = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(thing)    {
        return     thing;
      },function(thing)    {
        return     Elixir$ElixirScript$Kernel.is_binary(thing);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(thing)    {
        return     Elixir.Core.Functions.call_property(thing,'toString');
      }));
    export default {
        'Type': Elixir.Core.BitString,     'Implementation': {
        to_string
  }
  };