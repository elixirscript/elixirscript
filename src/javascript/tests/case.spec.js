import Core from '../lib/core';
import chai from 'chai';
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;

const expect = chai.expect;

describe('case', () => {
  it('case', () => {
    const clauses = [
      Patterns.clause(
        [
          new Tuple(
            Symbol.for('selector'),
            Patterns.variable(),
            Patterns.variable(),
          ),
        ],
        (i, value) => {
          return value;
        },
        i => {
          return Kernel.is_integer(i);
        },
      ),
      Patterns.clause([Patterns.variable()], value => {
        return value;
      }),
    ];

    const result = SpecialForms._case('thing', clauses);

    expect(result).to.equal('thing');
  });
});
