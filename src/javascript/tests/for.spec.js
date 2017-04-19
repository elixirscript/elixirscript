import test from 'ava';
import Core from '../lib/core';
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;
const BitString = Core.BitString;

const $ = Patterns.variable();

const collectable = {
  into: function(original) {
    const fun = Patterns.defmatch(
      Patterns.clause(
        [
          $,
          Patterns.type(Tuple, {
            values: [Symbol.for('cont'), Patterns.variable()],
          }),
        ],
        (list, x) => list.concat([x]),
      ),
      Patterns.clause([$, Symbol.for('done')], list => list),
    );

    return new Tuple([], fun);
  },
};

test('simple for', t => {
  const gen = Patterns.list_generator($, [1, 2, 3, 4]);
  const result = SpecialForms._for(
    Patterns.clause([$], x => x * 2),
    [gen],
    collectable,
  );

  t.deepEqual(result, [2, 4, 6, 8]);
});

test('for with multiple generators', t => {
  //for x <- [1, 2], y <- [2, 3], do: x*y

  const gen = Patterns.list_generator($, [1, 2]);
  const gen2 = Patterns.list_generator($, [2, 3]);
  const result = SpecialForms._for(
    Patterns.clause([$, $], (x, y) => x * y),
    [gen, gen2],
    collectable,
  );

  t.deepEqual(result, [2, 3, 4, 6]);
});

test('for with filter', t => {
  //for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
  const gen = Patterns.list_generator($, [1, 2, 3, 4, 5, 6]);
  const result = SpecialForms._for(
    Patterns.clause([$], x => x, x => x % 2 === 0),
    [gen],
    collectable,
  );

  t.deepEqual(result, [2, 4, 6]);
});

test('for with pattern matching', t => {
  //for {:user, name} <- [user: "john", admin: "john", user: "meg"], do
  // String.upcase(name)
  //end

  const gen = Patterns.list_generator(
    [Symbol.for('user'), $],
    [
      [Symbol.for('user'), 'john'],
      [Symbol.for('admin'), 'john'],
      [Symbol.for('user'), 'meg'],
    ],
  );

  const result = SpecialForms._for(
    Patterns.clause([[Symbol.for('user'), $]], name => name.toUpperCase()),
    [gen],
    collectable,
  );

  t.deepEqual(result, ['JOHN', 'MEG']);
});

test('for with bitstring', t => {
  //for <<r::8, g::8, b::8 <- <<213, 45, 132, 64, 76, 32, 76, 0, 0, 234, 32, 15>> >>, do: {r, g, b}

  const gen = Patterns.bitstring_generator(
    Patterns.bitStringMatch(
      BitString.integer({ value: $ }),
      BitString.integer({ value: $ }),
      BitString.integer({ value: $ }),
    ),
    new BitString(
      BitString.integer(213),
      BitString.integer(45),
      BitString.integer(132),
      BitString.integer(64),
      BitString.integer(76),
      BitString.integer(32),
      BitString.integer(76),
      BitString.integer(0),
      BitString.integer(0),
      BitString.integer(234),
      BitString.integer(32),
      BitString.integer(15),
    ),
  );

  const expression = Patterns.clause(
    [
      Patterns.bitStringMatch(
        BitString.integer({ value: $ }),
        BitString.integer({ value: $ }),
        BitString.integer({ value: $ }),
      ),
    ],
    (r, g, b) => new Tuple(r, g, b),
  );

  const result = SpecialForms._for(expression, [gen], collectable);

  t.deepEqual(result, [
    new Tuple(213, 45, 132),
    new Tuple(64, 76, 32),
    new Tuple(76, 0, 0),
    new Tuple(234, 32, 15),
  ]);
});
