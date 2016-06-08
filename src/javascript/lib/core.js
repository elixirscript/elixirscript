import Processes from 'erlang-processes';
import { Tuple, PID, Integer, Float } from './core/primitives';
import BitString from './core/bit_string';
import Patterns from './core/patterns';
import Functions from './core/functions';
import SpecialForms from './core/special_forms';

Functions.get_global().processes = Functions.get_global().processes || new Processes.ProcessSystem();

export default {
  ProcessSystem: Processes.ProcessSystem,
  Tuple,
  PID,
  BitString,
  Patterns,
  Integer,
  Float,
  Functions,
  SpecialForms
};
