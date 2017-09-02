import test from 'ava';
import Core from '../lib/core';

const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;

test('case', async (t) => {
  const clauses = [
    Patterns.clause(
      [new Tuple(Symbol.for('selector'), Patterns.variable(), Patterns.variable())],
      (i, value) => value,
      i => Kernel.is_integer(i),
    ),
    Patterns.clause([Patterns.variable()], value => value),
  ];

  const result = await SpecialForms._case('thing', clauses);

  t.is(result, 'thing');
});
