import chai from 'chai';
import Core from '../lib/core';

const SpecialForms = Core.SpecialForms;
const expect = chai.expect;

describe('cond', () => {
  it('cond', () => {
    const clauses = [
      [1 + 1 === 1, () => 'This will never match'],
      [2 * 2 !== 4, () => 'Nor this'],
      [true, () => 'This will'],
    ];

    const result = SpecialForms.cond(clauses);

    expect(result).to.equal('This will');
  });
});
