import ProcessSystem from './core/processes/process_system';
import { Tuple, PID, Integer, Float, List } from './core/primitives';
import BitString from './core/bit_string';
import Patterns from './core/patterns';
import Functions from './core/functions';

Functions.get_global().processes = Functions.get_global().processes || new ProcessSystem();

export {
  ProcessSystem,
  Tuple,
  PID,
  BitString,
  Patterns,
  Integer,
  Float,
  Functions,
  List
}
