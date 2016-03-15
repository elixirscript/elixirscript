    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$ElixirScript$Atom from './Elixir.ElixirScript.Atom';
    const to_string = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([null],function()    {
        return     '';
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(atom)    {
        return     Elixir$ElixirScript$Atom.to_string(atom);
      }));
    export default {
        'Type': Symbol,     'Implementation': {
        to_string
  }
  };