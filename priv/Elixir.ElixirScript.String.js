    import Elixir from './Elixir';
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const do_reverse = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case(['', Elixir.Core.Patterns.variable()],function(str)    {
        return     str;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,reverse_str)    {
        return     do_reverse(str.substr(1),reverse_str + last(str));
      }));
    const match__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,regex)    {
        return     str.match(regex) != null;
      }));
    const starts_with__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,prefix)    {
        return     str.startsWith(prefix);
      },function(str,prefix)    {
        return     Elixir$ElixirScript$Kernel.is_binary(prefix);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,prefixes)    {
        return     do_starts_with__qmark__(str,prefixes);
      },function(str,prefixes)    {
        return     Elixir$ElixirScript$Kernel.is_list(prefixes);
      }));
    const valid_character__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(codepoint)    {
        return     Elixir.Core.Functions.is_valid_character(codepoint);
      }));
    const do_ends_with__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard(), Object.freeze([])],function()    {
        return     false;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,suffixes)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     true;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     do_ends_with__qmark__(str,Elixir$ElixirScript$Kernel.tl(suffixes));
      })).call(this,ends_with__qmark__(str,Elixir$ElixirScript$Kernel.hd(suffixes)));
      }));
    const do_starts_with__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard(), Object.freeze([])],function()    {
        return     false;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,prefixes)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     true;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     do_starts_with__qmark__(str,Elixir$ElixirScript$Kernel.tl(prefixes));
      })).call(this,starts_with__qmark__(str,Elixir$ElixirScript$Kernel.hd(prefixes)));
      }));
    const ends_with__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,suffix)    {
        return     str.endsWith(suffix);
      },function(str,suffix)    {
        return     Elixir$ElixirScript$Kernel.is_binary(suffix);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,suffixes)    {
        return     do_ends_with__qmark__(str,suffixes);
      },function(str,suffixes)    {
        return     Elixir$ElixirScript$Kernel.is_list(suffixes);
      }));
    const contains__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,s)    {
        return     str.indexOf(s) > -1;
      },function(str,s)    {
        return     Elixir$ElixirScript$Kernel.is_binary(s);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,s)    {
        return     do_contains__qmark__(str,s);
      },function(str,s)    {
        return     Elixir$ElixirScript$Kernel.is_list(s);
      }));
    const do_contains__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard(), Object.freeze([])],function()    {
        return     false;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,prefixes)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     true;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     do_contains__qmark__(str,Elixir$ElixirScript$Kernel.tl(prefixes));
      })).call(this,contains__qmark__(str,Elixir$ElixirScript$Kernel.hd(prefixes)));
      }));
    const to_atom = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Symbol.for(str);
      }));
    const capitalize = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        let [first] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(str[0],'toUpperCase'));
        let [rest] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Functions.call_property(str.substr(1),'toLowerCase'));
        return     first + rest;
      }));
    const to_existing_atom = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Symbol.for(str);
      }));
    const downcase = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Elixir.Core.Functions.call_property(str,'toLowerCase');
      }));
    const reverse = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     do_reverse(str,'');
      }));
    const next_grapheme = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([null],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([''],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     new Elixir.Core.Tuple(str[0],str.substr(1));
      }));
    const duplicate = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,n)    {
        return     str.repeat(n);
      }));
    const upcase = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Elixir.Core.Functions.call_property(str,'toUpperCase');
      }));
    const to_char_list = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     str.split('');
      }));
    const to_float = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Elixir.Core.Functions.call_property(Elixir.Core,'get_global').parseFloat(str);
      }));
    const first = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([null],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     str[0];
      }));
    const last = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([null],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     str[length(str) - 1];
      }));
    const at = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,pos)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([true],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     str[pos];
      })).call(this,pos > length(str));
      }));
    const next_codepoint = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([null],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([''],function()    {
        return     null;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     new Elixir.Core.Tuple(str[0].codePointAt(0),str.substr(1));
      }));
    const split = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Elixir.Core.Functions.call_property(str,'split');
      }));
    const graphemes = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     str.split(Object.freeze([]));
      }));
    const do_codepoints = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case(['', Elixir.Core.Patterns.variable()],function(codepoint_list)    {
        return     codepoint_list;
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,codepoint_list)    {
        return     do_codepoints(str.substr(1),codepoint_list.concat(Object.freeze([first.codePointAt(0)])));
      }));
    const codepoints = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     do_codepoints(str,Object.freeze([]));
      }));
    const to_integer = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Elixir.Core.Functions.call_property(Elixir.Core,'get_global').parseInt(str,10);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(str,base)    {
        return     Elixir.Core.Functions.call_property(Elixir.Core,'get_global').parseInt(str,base);
      }));
    const length = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(str)    {
        return     Elixir.Core.Functions.call_property(str,'length');
      }));
    export default {
        match__qmark__,     starts_with__qmark__,     valid_character__qmark__,     do_ends_with__qmark__,     do_starts_with__qmark__,     ends_with__qmark__,     contains__qmark__,     do_contains__qmark__,     to_atom,     capitalize,     to_existing_atom,     downcase,     reverse,     next_grapheme,     duplicate,     upcase,     to_char_list,     to_float,     first,     last,     at,     next_codepoint,     split,     graphemes,     do_codepoints,     codepoints,     to_integer,     length
  };