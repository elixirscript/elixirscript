import Type from './type';
import object from './object';

function buildMatch(pattern) {
  // A parameter can either be a function, or the result of invoking that
  // function so we need to check for both.
  if (Type.isUndefined(pattern) || Type.isWildcard(pattern)) {
    return matchWildcard(pattern);
  } else if(Type.isBound(pattern)) {
    return matchBound(pattern);
  } else if (Type.isParameter(pattern)) {
    return matchParameter(pattern);
  } else if (Type.isHeadTail(pattern)) {
    return matchHeadTail(pattern);
  } else if (Type.isStartsWith(pattern)) {
    return matchStartsWith(pattern);
  } else if (Type.isCapture(pattern)) {
    return matchCapture(pattern);
  } else if (Type.isAtom(pattern)) {
    return matchAtom(pattern);
  } else if (Type.isRegExp(pattern)) {
    return matchRegExp(pattern);
  } else if (Type.isObject(pattern)) {
    return matchObject(pattern);
  } else if (Type.isArray(pattern)) {
    return matchArray(pattern);
  } else if (Type.isFunction(pattern)) {
    return matchFunction(pattern);
  } else if (Type.isSymbol(pattern)) {
    return matchSymbol(pattern);
  }
}

function equals(one, two){
  if(typeof one !== typeof two){
    return false;
  }

  if(Type.isArray(one) || Type.isObject(one) || Type.isString(one)){
    if(one.length !== two.length){
      return false;
    }

    for(let i in one){
      if(!equals(one[i], two[i])){
        return false;
      }
    }

    return true;
  }

  return one === two;
}

function matchBound(pattern){
  return function(value, bindings){
    return equals(value, pattern.value) && bindings.push(value) > 0;
  };
}

function matchParameter(pattern){
  return function(value, bindings) {
    return bindings.push(value) > 0;
  };
}

function matchWildcard(pattern){
  return function() {
    return true;
  };
}

function matchHeadTail(patternHeadTail){
  return function(value, bindings) {
    return value.length > 1 &&
    bindings.push(value[0]) > 0 &&
    bindings.push(value.slice(1)) > 0;
  };
}

function matchCapture(patternCapture){
  let pattern = patternCapture.pattern;
  let subMatches = buildMatch(pattern);

  return function(value, bindings) {
    return subMatches(value, bindings) && bindings.push(value) > 0;
  };

}

function matchStartsWith(patternStartsWith) {
  let substr = patternStartsWith.substr;

  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    };
  }

  return function(value, bindings) {
    return Type.isString(substr) &&
      value.startsWith(substr) &&
      value.substring(substr.length) !== '' &&
      bindings.push(value.substring(substr.length)) > 0;
  };
}

function matchSymbol(patternSymbol) {
  let type = typeof patternSymbol,
    value = patternSymbol;

  return function(valueSymbol, bindings) {
    return (typeof valueSymbol === type && valueSymbol === value);
  };
}

function matchAtom(patternAtom) {
  let type = typeof patternAtom,
    value = patternAtom;

  return function(valueAtom, bindings) {
    return (typeof valueAtom === type && valueAtom === value) ||
      (typeof value === 'number' && isNaN(valueAtom) && isNaN(value));
  };
}

function matchRegExp(patternRegExp) {
  return function(value, bindings) {
    return !(typeof value === undefined) && typeof value === 'string' && patternRegExp.test(value);
  };
}

function matchFunction(patternFunction) {
  return function(value, bindings) {
    return value.constructor === patternFunction &&
      bindings.push(value) > 0;
  };
}

function matchArray(patternArray) {
  let patternLength = patternArray.length,
    subMatches = patternArray.map(function(value) {
      return buildMatch(value);
    });

  return function(valueArray, bindings) {
    return patternLength === valueArray.length &&
      valueArray.every(function(value, i) {
        return (i in subMatches) && subMatches[i](valueArray[i], bindings);
      });
  };
}

function matchObject(patternObject) {
  let type = patternObject.constructor,
    patternLength = 0,
    // Figure out the number of properties in the object
    // and the keys we need to check for. We put these
    // in another object so access is very fast. The build_match
    // function creates new subtests which we execute later.
    subMatches = object.map(patternObject, function(value) {
      patternLength += 1;
      return buildMatch(value);
    });

  // We then return a function which uses that information
  // to check against the object passed to it.
  return function(valueObject, bindings) {
    if(valueObject.constructor !== type){
      return false;
    }

    let newValueObject = {};

    for(let key of Object.keys(patternObject)){
      if(key in valueObject){
        newValueObject[key] = valueObject[key];
      }else{
        return false;
      }
    }

    // Checking the object type is very fast so we do it first.
    // Then we iterate through the value object and check the keys
    // it contains against the hash object we built earlier.
    // We also count the number of keys in the value object,
    // so we can also test against it as a final check.
    return object.every(newValueObject, function(value, key) {
        return ((key in subMatches) && subMatches[key](newValueObject[key], bindings));
      });
  };
}


export default {
  buildMatch
};
