import Erlang from './erlang';
import Kernel from './kernel';

let Keyword = {};

Keyword.__MODULE__ = Erlang.atom("Keyword");

Keyword.has_key__qm__ = function(keywords, key){
  for(let keyword of keywords){
    if(Kernel.elem(keyword, 0) == key){
      return true;
    }
  }

  return false;
}

Keyword.get = function(keywords, key, the_default = null){
  for(let keyword of keywords){
    if(Kernel.elem(keyword, 0) == key){
      return Kernel.elem(keyword, 1);
    }
  }

  return the_default;
}

export default Keyword;