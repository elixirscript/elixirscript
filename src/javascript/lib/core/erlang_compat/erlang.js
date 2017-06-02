// http://erlang.org/doc/man/erlang.html

function atom_to_binary(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  return Symbol.keyFor(atom);
}

function list_concatenation(list1, list2) {
  return list1.concat(list2);
}

function list_subtraction(list1, list2) {
  const list = [...list1];

  for (const item of list2) {
    const index = list.indexOf(item);

    if (index > -1) {
      list.splice(index, 1);
    }
  }

  return list;
}

function plus(left, right) {
  if (!right) {
    return +left;
  }

  return left + right;
}

function minus(left, right) {
  if (!right) {
    return -left;
  }

  return left - right;
}

function multiply(left, right) {
  return left * right;
}

function div(left, right) {
  return left / right;
}

function equal(left, right) {
  return left == right;
}

function doesNotEqual(left, right) {
  return left != right;
}

function greaterThan(left, right) {
  return left > right;
}

function greaterThanOrEqualTo(left, right) {
  return left >= right;
}

function lessThan(left, right) {
  return left < right;
}

function lessThanOrEqualTo(left, right) {
  return left <= right;
}

function strictlyEqual(left, right) {
  return left === right;
}

function doesNotStrictlyEqual(left, right) {
  return left !== right;
}

function and(left, right) {
  return left && right;
}

function or(left, right) {
  return left || right;
}

function not(x) {
  return !x;
}

function rem(left, right) {
  return left % right;
}

function band(left, right) {
  return left & right;
}

function bor(left, right) {
  return left | right;
}

function bnot(x) {
  return ~x;
}

function bsl(left, right) {
  return left << right;
}

function bsr(left, right) {
  return left >> right;
}

function bxor(left, right) {
  return left ^ right;
}

export default {
  atom_to_binary,
  list_concatenation,
  list_subtraction,
  plus,
  minus,
  multiply,
  div,
  equal,
  greaterThan,
  greaterThanOrEqualTo,
  lessThan,
  lessThanOrEqualTo,
  doesNotEqual,
  strictlyEqual,
  doesNotStrictlyEqual,
  and,
  or,
  not,
  rem,
  band,
  bor,
  bsl,
  bsr,
  bxor,
  bnot,
};
