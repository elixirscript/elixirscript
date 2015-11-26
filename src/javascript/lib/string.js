import Kernel from './kernel';
import Chars from './string/chars';

function to_atom(string){
  return Symbol.for(string);
}

function to_existing_atom(string){
  return Symbol.for(string);
}

function to_char_list(string){
  return string.split('');
}

function to_float(string){
  return parseFloat(string);
}

function to_integer(string, base = 10){
  return parseInt(string, base);
}

function upcase(binary){
  return binary.toUpperCase();
}

function downcase(binary){
  return binary.toLowerCase();
}

function at(string, position){
  if(position > (string.length - 1)){
    return null;
  }

  return string[position];
}

function capitalize(string){
  let returnString = "";

  for(let i = 0; i < string.length; i++){
    if(i === 0){
      returnString = returnString + string[i].toUpperCase();
    }else{
      returnString = returnString + string[i].toLowerCase();      
    }
  }

  return returnString;
}


function codepoints(string){
  return to_char_list(string).map(function(c){
    return c.codePointAt(0);
  });
}


function contains__qm__(string, contains){
  if(Array.isArray(contains)){
    return contains.some(function(s){
      return string.indexOf(s) > -1;
    });
  }

  return string.indexOf(contains) > -1;
}

function duplicate(subject, n){
  return subject.repeat(n);
}

function ends_with__qm__(string, suffixes){
  if(Array.isArray(suffixes)){
    return suffixes.some(function(s){
      return string.endsWith(s);
    });
  }

  return string.endsWith(suffixes);
}

function first(string){
  if(!string){
    return null;
  }

  return string[0];
}

function graphemes(string){
  return string.split('');
}

function last(string){
  if(!string){
    return null;
  }

  return string[string.length - 1];
}

function length(string){
  return string.length;
}


function match__qm__(string, regex){
  return string.match(regex) != null;
}


function next_codepoint(string){
  if(!string || string === ""){
    return null;
  }

  return Kernel.SpecialForms.tuple(string[0].codePointAt(0), string.substr(1));
}


function next_grapheme(string){
  if(!string || string === ""){
    return null;
  }

  return Kernel.SpecialForms.tuple(string[0], string.substr(1));
}


function reverse(string){
  let returnValue = "";

  for (var i = string.length - 1; i >= 0; i--) {
    returnValue = returnValue + string[i];
  };

  return returnValue;
}


function split(string){
  return string.split();
}


function starts_with__qm__(string, prefixes){
  if(Array.isArray(prefixes)){
    return prefixes.some(function(s){
      return string.startsWith(s);
    });
  }

  return string.startsWith(prefixes);
}

function valid_character__qm__(codepoint){
  try{
    return String.fromCodePoint(codepoint) != null;
  }catch(e){
    return false;
  }
}


export default {
  at,
  capitalize,
  codepoints,
  contains__qm__,
  downcase,
  duplicate,
  ends_with__qm__,
  first,
  graphemes,
  last,
  length,
  match__qm__,
  next_codepoint,
  next_grapheme,
  reverse,
  split,
  starts_with__qm__,
  to_atom,
  to_char_list,
  to_existing_atom,
  to_float,
  to_integer,
  upcase,
  valid_character__qm__,
  Chars
}