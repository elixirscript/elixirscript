let Atom;

Atom = function(_value){
  return Symbol.for(_value);
};

Atom.__MODULE__ = Atom("Atom");

Atom.to_string = function (atom) {
  return Symbol.keyFor(atom);
};

Atom.to_char_list = function (atom) {
  return Atom.to_string(atom).split('');
};

export default Atom;
