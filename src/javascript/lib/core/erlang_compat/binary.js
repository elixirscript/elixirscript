import erlang from './erlang';
import proplists from './proplists';

function at(subject, pos) {
  return subject.charAt(pos);
}

function copy(subject, n = 1) {
  return subject.repeat(n);
}

function first(subject) {
  //TODO: raise badarg on size 0
  return at(subject, 0);
}

function last(subject) {
  //TODO: raise badarg on size 0
  return subject.slice(-1);
}

function list_to_bin(bytelist) {
  return erlang.list_to_binary(bytelist);
}

//TODO: How to create a tuple on JS side from part/3?
//function part(subject, posOrTuple, len=null) {
//    if (len == null) "/2 called" else "/3 called"
//}

function part(subject, pos, len) {
    return subject.substr(pos, len);
}

//TODO: Support more options
//TODO: pattern cannot be list of strings
function replace(subject, pattern, replacement, options=[]) {
    const opt_global = proplists.get_value(Symbol('global'), options);

    var regex;
    if (opt_global.toString() != Symbol('undefined').toString()) {
        regex = new RegExp(pattern, 'g');
    } else {
        regex = new RegExp(pattern, '');
    }
    
    return subject.replace(regex, replacement)
}

//TODO: Support more options, global is implied
//TODO: pattern cannot be list of strings
function split(subject, pattern, options=[]) {
    return subject.split(pattern)
}

export default {
  at,
  copy,
  first,
  last,
  list_to_bin,
  part,
  replace,
  split,
};
