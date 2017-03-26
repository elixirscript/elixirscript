import Core from '../lib/core';
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;

import chai from 'chai';
const expect = chai.expect;

describe('try', () => {
  it('try', () => {
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

    const value = SpecialForms._try(
      () => {
        return 1 / x;
      },
      null,
      null,
      Patterns.defmatch(
        Patterns.clause(
          [Patterns.variable()],
          y => {
            return Symbol.for('small');
          },
          y => {
            return y < 1 && y > -1;
          },
        ),
        Patterns.clause([Patterns.wildcard()], () => {
          return Symbol.for('large');
        }),
      ),
      null,
    );

    expect(value).to.equal(Symbol.for('large'));
  });
});
