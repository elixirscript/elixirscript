import Processes from 'erlang-processes';
import Patterns from 'tailored';
import ErlangTypes from 'erlang-types';
import Functions from './core/functions';
import SpecialForms from './core/special_forms';
import Store from './core/store';

let processes = new Processes.ProcessSystem();

class Integer {}
class Float {}

export default {
  ProcessSystem: Processes.ProcessSystem,
  processes: processes,
  Tuple: ErlangTypes.Tuple,
  PID: ErlangTypes.PID,
  BitString: ErlangTypes.BitString,
  Patterns,
  Integer,
  Float,
  Functions,
  SpecialForms,
  Store
};
