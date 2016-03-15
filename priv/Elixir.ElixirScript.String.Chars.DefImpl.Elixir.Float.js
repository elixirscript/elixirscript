    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const to_string = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(float)    {
        return     Elixir.Core.Functions.call_property(float,'toString');
      }));
    export default {
        'Type': Elixir.Core.Float,     'Implementation': {
        to_string
  }
  };