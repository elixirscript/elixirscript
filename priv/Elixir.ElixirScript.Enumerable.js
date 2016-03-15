    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Implementations from './Elixir.ElixirScript.Enumerable.Defimpl';
    const Elixir$ElixirScript$Enumerable = Elixir.Core.Functions.defprotocol({
        reduce: function()    {
        
      },     member__qmark__: function()    {
        
      },     count: function()    {
        
      }
  });
    for(let {Type,Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$ElixirScript$Enumerable,Type,Implementation)
    export default Elixir$ElixirScript$Enumerable;