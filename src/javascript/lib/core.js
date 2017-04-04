import Patterns from 'tailored';
import ErlangTypes from 'erlang-types';
import Functions from './core/functions';
import SpecialForms from './core/special_forms';

class Integer {}
class Float {}
const global = Functions.get_global();

global.__elixirscript_store__ = new Map();
global.__elixirscript_names__ = new Map();

export default {
  Tuple: ErlangTypes.Tuple,
  PID: ErlangTypes.PID,
  BitString: ErlangTypes.BitString,
  Patterns,
  Integer,
  Float,
  Functions,
  SpecialForms,
  global,
};
