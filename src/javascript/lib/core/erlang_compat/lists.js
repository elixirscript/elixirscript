// http://erlang.org/doc/man/lists.html
import ErlangTypes from 'erlang-types';

function reverse(list) {
  return [...list].reverse();
}

function foreach(fun, list) {
  list.forEach(x => fun(x));

  return Symbol.for('ok');
}

function duplicate(n, elem) {
  const list = [];

  while (list.length < n) {
    list.push(elem);
  }

  return list;
}

function flatten(deepList, tail = []) {
  const val = deepList.reduce((acc, value) => {
    if (Array.isArray(value)) {
      return acc.concat(flatten(value));
    }

    return acc.concat(value);
  }, []);

  return val.concat(tail);
}

function foldl(fun, acc0, list) {
  return list.reduce((acc, value) => {
    return fun(value, acc);
  }, acc0);
}

function foldr(fun, acc0, list) {
  return foldl(fun, acc0, reverse(list));
}

function keyfind(key, n, tupleList) {
  for (const tuple of tupleList) {
    if (tuple.get(n - 1) === key) {
      return tuple;
    }
  }

  return false;
}

function keymember(key, n, tupleList) {
  if (keyfind(key, n, tupleList) === false) {
    return false;
  }

  return true;
}

function keyreplace(key, n, tupleList, newTuple) {
  const newTupleList = [...tupleList];

  for (let index = 0; index < newTupleList.length; index++) {
    if (newTupleList[index].get(n - 1) === key) {
      newTupleList[index] = newTuple;
      return newTupleList;
    }
  }

  return newTupleList;
}

function keysort(n, tupleList) {
  const newTupleList = [...tupleList];

  return newTupleList.sort((a, b) => {
    if (a.get(n - 1) < b.get(n - 1)) {
      return -1;
    } else if (a.get(n - 1) > b.get(n - 1)) {
      return 1;
    }

    return 0;
  });
}

function keystore(key, n, tupleList, newTuple) {
  const newTupleList = [...tupleList];

  for (let index = 0; index < newTupleList.length; index++) {
    if (newTupleList[index].get(n - 1) === key) {
      newTupleList[index] = newTuple;
      return newTupleList;
    }
  }

  return newTupleList.concat(newTuple);
}

function keydelete(key, n, tupleList) {
  const newTupleList = [];
  let deleted = false;

  for (let index = 0; index < tupleList.length; index++) {
    if (deleted === false && tupleList[index].get(n - 1) === key) {
      deleted = true;
    } else {
      newTupleList.push(tupleList[index]);
    }
  }

  return newTupleList;
}

function keytake(key, n, tupleList) {
  const result = keyfind(key, n, tupleList);

  if (result !== false) {
    return new ErlangTypes.Tuple(
      result.get(n - 1),
      result,
      keydelete(key, n, tupleList)
    );
  }

  return false;
}

function mapfoldl(fun, acc0, list1) {
  const listResult = [];
  let accResult = acc0;

  for (const item of list1) {
    const tuple = fun(item, accResult);
    listResult.push(tuple.get(0));
    accResult = tuple.get(1);
  }

  return new ErlangTypes.Tuple(listResult, accResult);
}

function concat(things) {
  return things.map(v => v.toString()).join();
}

function map(fun, list) {
  return list.map(value => fun(value));
}

function filter(pred, list1) {
  return list1.filter(x => pred(x));
}

function filtermap(fun, list1) {
  const list2 = [];

  for (const item of list1) {
    const value = fun(item);

    if (value === true) {
      list2.push(item);
    } else if (value instanceof ErlangTypes.Tuple && value.get(0) === true) {
      list2.push(value.get(1));
    }
  }

  return list2;
}

function member(elem, list) {
  for (const item of list) {
    if (item === elem) {
      return true;
    }
  }

  return false;
}

function all(pred, list) {
  for (const item of list) {
    if (pred(item) === false) {
      return false;
    }
  }

  return true;
}

function any(pred, list) {
  for (const item of list) {
    if (pred(item) === true) {
      return true;
    }
  }

  return false;
}

function splitwith(pred, list) {
  let switchToList2 = false;
  const list1 = [];
  const list2 = [];

  for (const item of list) {
    if (switchToList2 === true) {
      list2.push(item);
    } else if (pred(item) === true) {
      list1.push(item);
    } else {
      switchToList2 = true;
      list2.push(item);
    }
  }

  return new ErlangTypes.Tuple(list1, list2);
}

function sort(...args) {
  if (args.length === 1) {
    const list2 = [...args[0]];
    return list2.sort();
  }

  const fun = args[0];
  const list2 = [...args[1]];

  return list2.sort((a, b) => {
    const result = fun(a, b);

    if (result === true) {
      return -1;
    }

    return 1;
  });
}

export default {
  reverse,
  foreach,
  duplicate,
  flatten,
  foldl,
  foldr,
  keydelete,
  keyfind,
  keymember,
  keyreplace,
  keysort,
  keystore,
  keytake,
  mapfoldl,
  concat,
  map,
  filter,
  filtermap,
  member,
  all,
  any,
  splitwith,
  sort
};
