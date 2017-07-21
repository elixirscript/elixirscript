import Patterns from 'tailored';
import ErlangTypes from 'erlang-types';
import Functions from './core/functions';
import SpecialForms from './core/special_forms';
import erlang from './core/erlang_compat/erlang';
import maps from './core/erlang_compat/maps';
import lists from './core/erlang_compat/lists';
import elixir_errors from './core/erlang_compat/elixir_errors';
import io from './core/erlang_compat/io';
import Store from './core/store';

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
  io
};
