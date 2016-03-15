    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Implementations from './Elixir.ElixirScript.Collectable.Defimpl';
    const Elixir$ElixirScript$Collectable = Elixir.Core.Functions.defprotocol({
        into: function()    {
        
      }
  });
    for(let {Type,Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$ElixirScript$Collectable,Type,Implementation)
    export default Elixir$ElixirScript$Collectable;