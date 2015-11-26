/* @flow */
import Checks from "./checks";
import Resolvers from "./resolvers";

export function buildMatch(pattern: any): Function {

  if(Checks.is_tuple(pattern)){
    return Resolvers.resolveTuple(pattern);
  }

  if(Checks.is_variable(pattern)){
    return Resolvers.resolveVariable(pattern);
  }

  if(Checks.is_wildcard(pattern)){
    return Resolvers.resolveWildcard(pattern);
  }

  if(Checks.is_undefined(pattern)){
    return Resolvers.resolveWildcard(pattern);
  }

  if(Checks.is_headTail(pattern)){
    return Resolvers.resolveHeadTail(pattern);
  }

  if(Checks.is_startsWith(pattern)){
    return Resolvers.resolveStartsWith(pattern);
  }

  if(Checks.is_capture(pattern)){
    return Resolvers.resolveCapture(pattern);
  }

  if(Checks.is_bound(pattern)){
    return Resolvers.resolveBound(pattern);
  }

  if(Checks.is_type(pattern)){
    return Resolvers.resolveType(pattern);
  }

  if(Checks.is_array(pattern)){
    return Resolvers.resolveArray(pattern);
  }

  if(Checks.is_number(pattern)){
    return Resolvers.resolveNumber(pattern);
  }

  if(Checks.is_string(pattern)){
    return Resolvers.resolveString(pattern);
  }

  if(Checks.is_boolean(pattern)){
    return Resolvers.resolveBoolean(pattern);
  }

  if(Checks.is_symbol(pattern)){
    return Resolvers.resolveSymbol(pattern);
  }

  if(Checks.is_null(pattern)){
    return Resolvers.resolveNull(pattern);
  }

  if(Checks.is_object(pattern)){
    return Resolvers.resolveObject(pattern);
  }

  return Resolvers.resolveNoMatch();
}