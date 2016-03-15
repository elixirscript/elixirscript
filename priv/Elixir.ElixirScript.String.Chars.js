    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Implementations from './Elixir.ElixirScript.String.Chars.Defimpl';
    const Elixir$ElixirScript$String$Chars = Elixir.Core.Functions.defprotocol({
        to_string: function()    {
        
      }
  });
    for(let {Type,Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$ElixirScript$String$Chars,Type,Implementation)
    export default Elixir$ElixirScript$String$Chars;