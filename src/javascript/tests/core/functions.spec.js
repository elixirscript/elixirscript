import Core from '../../lib/core';
const Functions = Core.Functions;

import chai from 'chai';
const expect = chai.expect;

describe('Functions', () => {
  it('call_property', () => {
    expect(Functions.call_property(1, 'toString')).to.equal('1');
    expect(Functions.call_property([], 'toString')).to.equal('');
    expect(Functions.call_property([], 'length')).to.equal(0);
    expect(Functions.call_property('', 'toString')).to.equal('');
    expect(Functions.call_property('', 'length')).to.equal(0);
    expect(Functions.call_property(Symbol('test'), 'toString')).to.equal('Symbol(test)');
    expect(Functions.call_property({ completed: false }, 'completed')).to.equal(false);
    expect(Functions.call_property({ id: 0 }, 'id')).to.equal(0);
  });
});
