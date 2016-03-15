    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const to_string = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(atom)    {
        return     Symbol.keyFor(atom);
      }));
    const to_char_list = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(atom)    {
        return     to_string.split('');
      }));
    export default {
        to_string,     to_char_list
  };