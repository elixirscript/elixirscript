import Erlang from './erlang';

let Atom = {};

Atom.__MODULE__ = Erlang.atom("Atom");

Atom.to_string = function (atom) {
  return Symbol.keyFor(atom);
};

Atom.to_char_list = function (atom) {
  return Atom.to_string(atom).split('');
};

export default Atom;
