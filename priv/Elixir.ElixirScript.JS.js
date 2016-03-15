    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const global = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
        return     Elixir.Core.Functions.call_property(Elixir.Core.Functions,'get_global');
      }));
    export default {
        global
  };