    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$ElixirScript$JS from './Elixir.ElixirScript.JS';
    import Elixir$ElixirScript$Keyword from './Elixir.ElixirScript.Keyword';
    const update = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(agent,fun)    {
        let [current_state] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').get(agent,'state'));
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(agent,'state',fun(current_state));
        return     Symbol.for('ok');
      }));
    const get_and_update = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(agent,fun)    {
        let [current_state] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').get(agent,'state'));
        let [val,new_state] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
  }),fun(current_state));
        let _ref = new Elixir.Core.Tuple(val,new_state);
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(agent,'state',new_state);
        return     val;
      }));
    const start = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(fun)    {
        let [pid] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes'),'spawn'));
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(pid,'state',fun());
        return     new Elixir.Core.Tuple(Symbol.for('ok'),pid);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(fun,options)    {
        let [pid] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes'),'spawn'));
        Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     null;
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        let [pid1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').register(Elixir$ElixirScript$Keyword.get(options,Symbol.for('name')),pid));
        return     pid1;
      })).call(this,Elixir$ElixirScript$Keyword.has_key__qmark__(options,Symbol.for('name')));
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').put(pid,'state',fun());
        return     new Elixir.Core.Tuple(Symbol.for('ok'),pid);
      }));
    const get = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(agent,fun)    {
        let [current_state] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').get(agent,'state'));
        return     fun(current_state);
      }));
    const stop = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(view)    {
        Elixir.Core.Functions.call_property(Elixir.Core.Functions.call_property(Elixir$ElixirScript$JS,'global'),'processes').exit(view);
        return     Symbol.for('ok');
      }));
    export default {
        update,     get_and_update,     start,     get,     stop
  };