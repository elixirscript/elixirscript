import test from 'ava';
import Core from '../lib/core';

const SpecialForms = Core.SpecialForms;

test('cond', t => {
  const clauses = [
    [1 + 1 === 1, () => 'This will never match'],
    [2 * 2 !== 4, () => 'Nor this'],
    [true, () => 'This will'],
  ];

  const result = SpecialForms.cond(clauses);

  t.is(result, 'This will');
});
