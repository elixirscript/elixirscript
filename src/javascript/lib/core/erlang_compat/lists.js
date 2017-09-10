// http://erlang.org/doc/man/lists.html
import ErlangTypes from 'erlang-types';

function reverse(list) {
  return [...list].reverse();
}

function* foreach(fun, list) {
  for (const x of list) {
    yield* fun(x);
  }

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

function* foldl(fun, acc0, list) {
  let acc = acc0;

  for (const value of list) {
    acc = yield* fun(value, acc);
  }

  return acc;
}

function foldr(fun, acc0, list) {
  return foldl(fun, acc0, reverse(list));
}

function keyfind(key, n, list) {
  for (const ele of list) {
    if (ele instanceof ErlangTypes.Tuple && ele.get(n - 1) === key) {
      return ele;
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

function* mapfoldl(fun, acc0, list1) {
  const listResult = [];
  let accResult = acc0;

  for (const item of list1) {
    const tuple = yield* fun(item, accResult);
    listResult.push(tuple.get(0));
    accResult = tuple.get(1);
  }

  return new ErlangTypes.Tuple(listResult, accResult);
}

function concat(things) {
  return things.map(v => v.toString()).join();
}

function* map(fun, list) {
  const reList = [];

  for (const value of list) {
    const result = yield* fun(value);
    reList.push(result);
  }

  return reList;
}

function* filter(pred, list1) {
  const reList = [];

  for (const value of list1) {
    const result = yield* pred(value);
    if (result === true) {
      reList.push(value);
    }
  }

  return reList;
}

function* filtermap(fun, list1) {
  const list2 = [];

  for (const item of list1) {
    const value = yield* fun(item);

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

function* all(pred, list) {
  for (const item of list) {
    if ((yield* pred(item)) === false) {
      return false;
    }
  }

  return true;
}

function* any(pred, list) {
  for (const item of list) {
    if ((yield* pred(item)) === true) {
      return true;
    }
  }

  return false;
}

function* splitwith(pred, list) {
  let switchToList2 = false;
  const list1 = [];
  const list2 = [];

  for (const item of list) {
    if (switchToList2 === true) {
      list2.push(item);
    } else if ((yield* pred(item)) === true) {
      list1.push(item);
    } else {
      switchToList2 = true;
      list2.push(item);
    }
  }

  return new ErlangTypes.Tuple(list1, list2);
}

function* sort(...args) {
  if (args.length === 1) {
    const list2 = [...args[0]];
    return list2.sort();
  }

  const fun = args[0];
  const list2 = [...args[1]];

  const result = list2.sort(function*(a, b) {
    const sortResult = yield* fun(a, b);

    if (sortResult === true) {
      return -1;
    }

    return 1;
  });

  return Promise.all(result);
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
