    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$ElixirScript$JS from './Elixir.ElixirScript.JS';
    import Elixir$ElixirScript$Keyword from './Elixir.ElixirScript.Keyword';
    const start = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(dom_root,render_func,args)    {
        let [pid] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes'),'spawn'));
        let [tree] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),render_func.apply(null,args));
        let [root_node] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.VirtualDOM.create(tree));
        dom_root.appendChild(root_node);
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(pid,'state',new Elixir.Core.Tuple(root_node,tree,render_func));
        return     new Elixir.Core.Tuple(Symbol.for('ok'),pid);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(dom_root,render_func,args,options)    {
        let [pid] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes'),'spawn'));
        Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     null;
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        let [pid1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').register(Elixir$ElixirScript$Keyword.get(options,Symbol.for('name')),pid));
        return     pid1;
      })).call(this,Elixir$ElixirScript$Keyword.has_key__qmark__(options,Symbol.for('name')));
        let [tree] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),render_func.apply(null,args));
        let [root_node] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.VirtualDOM.create(tree));
        dom_root.appendChild(root_node);
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(pid,'state',new Elixir.Core.Tuple(root_node,tree,render_func));
        return     new Elixir.Core.Tuple(Symbol.for('ok'),pid);
      }));
    const render = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(view,args)    {
        let [root_node,tree,render_func] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
  }),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').get(view,'state'));
        let _ref = new Elixir.Core.Tuple(root_node,tree,render_func);
        let [new_tree] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),render_func.apply(null,args));
        let [patches] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.VirtualDOM.diff(tree,new_tree));
        let [root_node1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.VirtualDOM.patch(root_node,patches));
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(view,'state',new Elixir.Core.Tuple(root_node,new_tree,render_func));
        return     Symbol.for('ok');
      }));
    const stop = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(view)    {
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').exit(view);
        return     Symbol.for('ok');
      }));
    export default {
        start,     render,     stop
  };