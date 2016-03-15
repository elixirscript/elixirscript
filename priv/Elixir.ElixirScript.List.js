    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const do_flatten = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.variable()],function(flattened_list)    {
        return     flattened_list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,flattened_list)    {
        let [flattened_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(l)    {
        return     flattened_list.concat(do_flatten(l,Object.freeze([])));
      },function(l)    {
        return     Elixir$ElixirScript$Kernel.is_list(l);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(item)    {
        return     flattened_list.concat(Object.freeze([item]));
      })).call(this,Elixir$ElixirScript$Kernel.hd(list)));
        return     do_flatten(Elixir$ElixirScript$Kernel.tl(list),flattened_list);
      }));
    const do_duplicate = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard(), 0, Elixir.Core.Patterns.variable()],function(list)    {
        return     list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(data,size,list)    {
        return     do_duplicate(data,size - 1,list.concat(Object.freeze([data])));
      }));
    const do_delete = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,item,current_index,new_list)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.bound(item)],function()    {
        return     new_list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list.concat(Object.freeze([list[current_index]]));
      })).call(this,list[current_index]));
        return     do_delete(list,item,current_index + 1,new_list);
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list;
      })).call(this,current_index == Elixir$ElixirScript$Kernel.length(list));
      }));
    const do_keyreplace = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.wildcard()],function(new_list)    {
        return     new_list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position,new_list,new_tuple)    {
        let [current_value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir$ElixirScript$Kernel.hd(list));
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     new_list.concat(Object.freeze([current_value]));
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list.concat(Object.freeze([new_tuple]));
      })).call(this,Elixir$ElixirScript$Kernel.elem(current_value,position) == key));
        return     do_keyreplace(Elixir$ElixirScript$Kernel.tl(list),key,position,new_list,new_tuple);
      }));
    const do_keydelete = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()],function(new_list)    {
        return     new_list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position,new_list)    {
        let [current_value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir$ElixirScript$Kernel.hd(list));
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     new_list.concat(Object.freeze([current_value]));
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list;
      })).call(this,Elixir$ElixirScript$Kernel.elem(current_value,position) == key));
        return     do_keydelete(Elixir$ElixirScript$Kernel.tl(list),key,position,new_list);
      }));
    const do_delete_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,current_index,new_list)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     new_list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list.concat(Object.freeze([list[current_index]]));
      })).call(this,current_index == index));
        return     do_delete_at(list,index,current_index + 1,new_list);
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list;
      })).call(this,current_index == Elixir$ElixirScript$Kernel.length(list));
      }));
    const do_update_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,func,current_index,new_list)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     new_list.concat(Object.freeze([func(list[current_index])]));
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list.concat(Object.freeze([list[current_index]]));
      })).call(this,current_index == index));
        return     do_update_at(list,index,func,current_index + 1,new_list);
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list;
      })).call(this,current_index == Elixir$ElixirScript$Kernel.length(list));
      }));
    const do_keyfind = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()],function(__default__)    {
        return     __default__;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position,__default__)    {
        let [current_value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir$ElixirScript$Kernel.hd(list));
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     do_keyfind(Elixir$ElixirScript$Kernel.tl(list),key,position,__default__);
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     current_value;
      })).call(this,Elixir$ElixirScript$Kernel.elem(current_value,position) == key);
      }));
    const do_foldl = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([]), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()],function(acc,new_list)    {
        return     new Elixir.Core.Tuple(acc,new_list);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,acc,func,new_list)    {
        let [acc1,value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
  }),func(Elixir$ElixirScript$Kernel.hd(list),acc));
        let _ref = new Elixir.Core.Tuple(acc1,value);
        return     do_foldl(Elixir$ElixirScript$Kernel.tl(list),acc,func,new_list.concat(Object.freeze([value])));
      }));
    const do_insert_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,value,current_index,new_list)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     new_list.concat(Object.freeze([value, list[current_index]]));
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list.concat(Object.freeze([list[current_index]]));
      })).call(this,current_index == index));
        return     do_insert_at(list,index,value,current_index + 1,new_list);
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list;
      })).call(this,current_index == Elixir$ElixirScript$Kernel.length(list));
      }));
    const do_replace_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,value,current_index,new_list)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        let [new_list1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     new_list.concat(Object.freeze([value]));
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list.concat(Object.freeze([list[current_index]]));
      })).call(this,current_index == index));
        return     do_replace_at(list,index,value,current_index + 1,new_list);
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Object.freeze([false, null]),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     new_list;
      })).call(this,current_index == Elixir$ElixirScript$Kernel.length(list));
      }));
    const keymember__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position)    {
        return     keyfind(list,key,position) != null;
      }));
    const flatten = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     do_flatten(list,Object.freeze([]));
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,tail)    {
        return     do_flatten.concat(tail);
      }));
    const duplicate = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(data,size)    {
        return     do_duplicate(data,size,Object.freeze([]));
      }));
    const __delete__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,item)    {
        return     do_delete(list,item,0,Object.freeze([]));
      }));
    const keydelete = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position)    {
        return     do_keydelete(list,key,position,Object.freeze([]));
      }));
    const to_tuple = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     new Elixir.Core.Tuple(...list);
      }));
    const keyreplace = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position,new_tuple)    {
        return     do_keyreplace(list,key,position,Object.freeze([]),new_tuple);
      }));
    const append = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,term)    {
        return     concat(list,Object.freeze([term]));
      }));
    const prepend = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,term)    {
        return     concat(Object.freeze([term]),list);
      }));
    const replace_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,value)    {
        return     do_replace_at(list,index,value,0,Object.freeze([]));
      }));
    const keyfind = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position)    {
        return     do_keyfind(list,key,position,null);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,key,position,__default__)    {
        return     do_keyfind(list,key,position,__default__);
      }));
    const foldl = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,acc,func)    {
        return     do_foldl(list,acc,func,Object.freeze([]));
      }));
    const first = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     list[0];
      }));
    const update_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,func)    {
        return     do_update_at(list,index,func,0,Object.freeze([]));
      }));
    const last = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     list[Elixir$ElixirScript$Kernel.length(list) - 1];
      }));
    const insert_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index,value)    {
        return     do_insert_at(list,index,value,0,Object.freeze([]));
      }));
    const concat = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list_a,list_b)    {
        return     list_a.concat(list_b);
      }));
    const delete_at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,index)    {
        return     do_delete_at(list,index,0,Object.freeze([]));
      }));
    const foldr = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(list,acc,func)    {
        return     do_foldl(Elixir.Core.Functions.call_property(list.concat(Object.freeze([])),'reverse'),acc,func,Object.freeze([]));
      }));
    const wrap = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list)    {
        return     list;
      },function(list)    {
        return     Elixir$ElixirScript$Kernel.is_list(list);
      }),Elixir.Core.Patterns.make_case([null],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(term)    {
        return     term;
      }));
    const zip = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(list_of_lists)    {
        return     Elixir.Core.Functions.zip(list_of_lists);
      }));
    export default {
        keymember__qmark__,     flatten,     duplicate,     __delete__,     keydelete,     to_tuple,     keyreplace,     append,     prepend,     replace_at,     keyfind,     foldl,     first,     update_at,     last,     insert_at,     concat,     delete_at,     foldr,     wrap,     zip
  };