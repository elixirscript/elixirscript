import Patterns from 'tailored';
import ErlangTypes from 'erlang-types';
import Functions from './core/functions';
import SpecialForms from './core/special_forms';
import erlang from './core/erlang_compat/erlang';
import maps from './core/erlang_compat/maps';
import lists from './core/erlang_compat/lists';
import elixir_errors from './core/erlang_compat/elixir_errors';
import elixir_config from './core/erlang_compat/elixir_config';
import io from './core/erlang_compat/io';
import binary from './core/erlang_compat/binary';
import unicode from './core/erlang_compat/unicode';
import Store from './core/store';
import math from './core/erlang_compat/math';
import proplists from './core/erlang_compat/proplists';

class Integer {}
class Float {}

function get_global() {
  if (typeof self !== 'undefined') {
    return self;
  } else if (typeof window !== 'undefined') {
    return window;
  } else if (typeof global !== 'undefined') {
    return global;
  }

  console.warn('No global state found');
  return null;
}

const globalState = get_global();

globalState.__elixirscript_store__ = new Map();
globalState.__elixirscript_names__ = new Map();

export default {
  Tuple: ErlangTypes.Tuple,
  PID: ErlangTypes.PID,
  BitString: ErlangTypes.BitString,
  Reference: ErlangTypes.Reference,
  Patterns,
  Integer,
  Float,
  Functions,
  SpecialForms,
  Store,
  global: globalState,
  erlang,
  maps,
  lists,
  elixir_errors,
  io,
  binary,
  unicode,
  elixir_config,
  math,
  proplists,
};
