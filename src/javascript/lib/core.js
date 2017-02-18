import Patterns from "tailored";
import ErlangTypes from "erlang-types";
import Functions from "./core/functions";
import SpecialForms from "./core/special_forms";
import Store from "./core/store";

class Integer {}
class Float {}

export default {
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
