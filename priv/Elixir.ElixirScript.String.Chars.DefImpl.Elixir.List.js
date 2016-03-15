    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const to_string = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     Elixir.Core.Functions.call_property(list,'toString');
      }));
    export default {
        'Type': Array,     'Implementation': {
        to_string
  }
  };