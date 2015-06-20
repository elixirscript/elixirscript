let Atom;

Atom = function(_value){
  return Symbol.for(_value);
};

Atom.__MODULE__ = Atom("Atom");

Atom.to_string = function (atom) {
  let atomString = atom.toString();
  let indexOfOpenParen = atomString.indexOf("(");
  let indexOfCloseParen = atomString.lastIndexOf(")");
  return atomString.substring(indexOfOpenParen + 1, indexOfCloseParen);
};

Atom.to_char_list = function (atom) {
  let char_list = [];

  let atomString = Atom.to_string(atom);

  for(let i = 0; i < atomString.length; i++){
    char_list.push(atomString.charAt(i));
  }

  return char_list;
};

export default Atom;
