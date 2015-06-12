//TODO: evaluate using Symbol here (i.e Symbol.for("atomName"))
//      this would rid the need of using a custom Atom object

let Atom;

Atom = function(_value){
  if (!(this instanceof Atom)){
    return new Atom(_value);
  }

  this.toString = function(){
    return _value;
  };
};

Atom.__MODULE__ = Atom("Atom");

Atom.to_string = function (atom) {
  //let atomString = atom.toString();
  //let indexOfOpenParen = atomString.indexOf("(");
  //let indexOfCloseParen = atomString.lastIndexOf(")");
  //return atomString.substring(indexOfOpenParen+1, indexOfCloseParen);

  return atom.toString();
};

Atom.to_char_list = function (atom) {
  let char_list = [];

  for(let i = 0; i < atom.toString().length; i++){
    char_list.push(atom.toString().charAt(i));
  }

  return char_list;
};

export default Atom;
