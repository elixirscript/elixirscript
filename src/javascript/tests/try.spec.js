import test from 'ava';
import Core from '../lib/core';

const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;

test('try', async (t) => {
  /*
      try do
        1 / x
      else
        y when y < 1 and y > -1 ->
          :small
        _ ->
          :large
      end

    */

  const x = 1;

  const value = await SpecialForms._try(
    () => 1 / x,
    null,
    null,
    Patterns.defmatch(
      Patterns.clause([Patterns.variable()], () => Symbol.for('small'), y => y < 1 && y > -1),
      Patterns.clause([Patterns.wildcard()], () => Symbol.for('large')),
    ),
    null,
  );

  t.is(value, Symbol.for('large'));
});
