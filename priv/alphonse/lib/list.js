import Tuple from './tuple';
import Atom from './atom';

let List = {};

List.__MODULE_ = [Atom('List')];

List.to_tuple = function(list){
  return Tuple.apply(null, list);
};

export default List;