import Core from '../core';

function _case(condition, clauses){
  return Core.Patterns.defmatch(...clauses)(condition);
}

function cond(clauses){
  for(let clause of clauses){
    if(clause[0]){
      return clause[1]();
    }
  }

  throw new Error();
}

function map_update(map, values){
  return Object.freeze(
    Object.assign(
      Object.create(map.constructor.prototype), map, values
    )
  );
}

function _for(collections, fun, filter = () => true, into = [], previousValues = []){
  let pattern = collections[0][0];
  let collection = collections[0][1];

  if(collections.length === 1){
    if(collection instanceof Core.BitString){
      let bsSlice = collection.slice(0, pattern.byte_size());
      let i = 1;

      while(bsSlice.byte_size == pattern.byte_size()){
        let r = Core.Patterns.match_or_default(pattern, bsSlice);
        let args = previousValues.concat(r);

        if(r && filter.apply(this, args)){
          into = into.concat([fun.apply(this, args)]);
        }

        bsSlice = collection.slice(pattern.byte_size() * i, pattern.byte_size() * (i + 1));
        i++;
      }

      return into;
    }else{
      for(let elem of collection){
        let r = Core.Patterns.match_or_default(pattern, elem);
        let args = previousValues.concat(r);

        if(r && filter.apply(this, args)){
          into = into.concat([fun.apply(this, args)]);
        }
      }

      return into;
    }
  }else{
    let _into = [];

    if(collection instanceof Core.BitString){
      let bsSlice = collection.slice(0, pattern.byte_size());
      let i = 1;

      while(bsSlice.byte_size == pattern.byte_size()){
        let r = Core.Patterns.match_or_default(pattern, bsSlice);
        if(r){
          _into = into.concat(this._for(collections.slice(1), fun, filter, _into, previousValues.concat(r)));
        }

        bsSlice = collection.slice(pattern.byte_size() * i, pattern.byte_size() * (i + 1));
        i++;
      }
    }else{
      for(let elem of collection){
        let r = Core.Patterns.match_or_default(pattern, elem);
        if(r){
          _into = into.concat(this._for(collections.slice(1), fun, filter, _into, previousValues.concat(r)));
        }
      }
    }

    return _into;
  }
}

function _try(do_fun, rescue_function, catch_fun, else_function, after_function){
  let result = null;

  try{
    result = do_fun();
  }catch(e){
    let ex_result = null;

    if(rescue_function){
      try{
        ex_result = rescue_function(e);
        return ex_result;
      }catch(ex){
        if(ex instanceof Core.Patterns.MatchError){
          throw ex;
        }
      }
    }

    if(catch_fun){
      try{
        ex_result = catch_fun(e);
        return ex_result;
      }catch(ex){
        if(ex instanceof Core.Patterns.MatchError){
          throw ex;
        }
      }
    }

    throw e;

  }finally{
    if(after_function){
      after_function();
    }
  }

  if(else_function){
    try{
      return else_function(result);
    }catch(ex){
        if(ex instanceof Core.Patterns.MatchError){
          throw new Error("No Match Found in Else");
        }

      throw ex;
    }
  }else{
    return result;
  }
}

function _with(...args){
  let argsToPass = [];

  for(let i = 0; i < args.length; i++){
    if(i === args.length - 1){
      return args[i].apply(null, argsToPass);
    }else{
      let [pattern, func] = args[i];

      let result = func.apply(null, argsToPass);

      let patternResult = Core.Patterns.match_or_default(pattern, result);

      if(patternResult == null){
        return result;
      }else{
        argsToPass = argsToPass.concat(patternResult);
      }
    }
  }

  return null;
}

export default {
  _case,
  cond,
  map_update,
  _for,
  _try,
  _with
};
