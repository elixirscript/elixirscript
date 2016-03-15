    import Elixir from './Elixir';
    import Elixir$ElixirScript$Atom from './Elixir.ElixirScript.Atom';
    const build_if = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Object.freeze([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Symbol.for('do'), Elixir.Core.Patterns.variable()]
  })])],function(condition,do_clause)    {
        return     build_if(condition,Object.freeze([new Elixir.Core.Tuple(Symbol.for('do'),do_clause), new Elixir.Core.Tuple(Symbol.for('else'),null)]));
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Object.freeze([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Symbol.for('do'), Elixir.Core.Patterns.variable()]
  }), Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Symbol.for('else'), Elixir.Core.Patterns.variable()]
  })])],function(condition,do_clause,else_clause)    {
        return     new Elixir.Core.Tuple(Symbol.for('case'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),15)]),Object.freeze([condition, Object.freeze([new Elixir.Core.Tuple(Symbol.for('do'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('->'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),16)]),Object.freeze([Object.freeze([new Elixir.Core.Tuple(Symbol.for('when'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),16)]),Object.freeze([new Elixir.Core.Tuple(Symbol.for('x'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),16)]),null), new Elixir.Core.Tuple(Symbol.for('in'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),16)]),Object.freeze([new Elixir.Core.Tuple(Symbol.for('x'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),16)]),null), Object.freeze([false, null])]))]))]), else_clause])), new Elixir.Core.Tuple(Symbol.for('->'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),18)]),Object.freeze([Object.freeze([new Elixir.Core.Tuple(Symbol.for('_'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),18)]),null)]), do_clause]))]))])]));
      }));
    const build_unless = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Object.freeze([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Symbol.for('do'), Elixir.Core.Patterns.variable()]
  })])],function(condition,do_clause)    {
        return     build_unless(condition,Object.freeze([new Elixir.Core.Tuple(Symbol.for('do'),do_clause), new Elixir.Core.Tuple(Symbol.for('else'),null)]));
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Object.freeze([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Symbol.for('do'), Elixir.Core.Patterns.variable()]
  }), Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Symbol.for('else'), Elixir.Core.Patterns.variable()]
  })])],function(condition,do_clause,else_clause)    {
        return     new Elixir.Core.Tuple(Symbol.for('if'),Object.freeze([new Elixir.Core.Tuple(Symbol.for('line'),34)]),Object.freeze([condition, Object.freeze([new Elixir.Core.Tuple(Symbol.for('do'),else_clause), new Elixir.Core.Tuple(Symbol.for('else'),do_clause)])]));
      }));
    const is_bitstring = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     is_binary(term) || (term instanceof Elixir.Core.BitString);
      }));
    const is_boolean = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     (typeof term === 'boolean') || (term instanceof Boolean);
      }));
    const min = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(first,second)    {
        return     Math.min(first,second);
      }));
    const is_function = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     is_function(term,0);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.wildcard()],function(term)    {
        return     (typeof term === 'function') || (term instanceof Function);
      }));
    const is_atom = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     typeof term === 'symbol';
      }));
    const elem = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(tuple,index)    {
        return     Elixir.Core.Functions.apply(tuple,'get',Object.freeze([index]));
      }));
    const map_size = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     Elixir.Core.Functions.call_property(Object.keys(term),'length');
      }));
    const tuple_size = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(tuple)    {
        return     Elixir.Core.Functions.size(tuple);
      }));
    const is_tuple = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     term instanceof Elixir.Core.Tuple;
      }));
    const is_reference = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     false;
      }));
    const binary_part = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(binary,start,len)    {
        return     binary.substring(start,len);
      }));
    const is_nil = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     term === null;
      }));
    const is_pid = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     term instanceof Elixir.Core.PID;
      }));
    const tl = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     list.slice(1);
      }));
    const hd = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     list[0];
      }));
    const is_port = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     false;
      }));
    const is_list = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     Array.isArray(term);
      }));
    const is_float = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     is_number(term) && !Number.isInteger(term);
      }));
    const round = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
        return     Math.round(number);
      }));
    const abs = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
        return     Math.abs(number);
      }));
    const trunc = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
        return     Math.floor(number);
      }));
    const is_integer = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     Number.isInteger(term);
      }));
    const is_number = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     (typeof term === 'number') || (term instanceof Number);
      }));
    const apply = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(fun,args)    {
        return     Elixir.Core.Functions.apply(fun,args);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(module,fun,args)    {
        let [fun1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     fun;
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     Elixir$ElixirScript$Atom.to_string(fun);
      })).call(this,Elixir.Core.is_atom(fun)));
        return     Elixir.Core.Functions.apply(module,fun,args);
      }));
    const is_binary = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     typeof term === 'string';
      }));
    const is_map = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     (typeof term === 'object') || (term instanceof Object);
      }));
    const length = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     Elixir.Core.Functions.call_property(term,'length');
      }));
    const max = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(first,second)    {
        return     Math.max(first,second);
      }));
    export default {
        is_bitstring,     is_boolean,     min,     is_function,     is_atom,     elem,     map_size,     tuple_size,     is_tuple,     is_reference,     binary_part,     is_nil,     is_pid,     tl,     hd,     is_port,     is_list,     is_float,     round,     abs,     trunc,     is_integer,     is_number,     apply,     is_binary,     is_map,     length,     max
  };