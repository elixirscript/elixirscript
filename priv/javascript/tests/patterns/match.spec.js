var expect = require('chai').expect;
var Patterns = require("../../lib/patterns/patterns");

const _ = Patterns.wildcard();
const $ = Patterns.variable();

describe('match', () => {
  it('must return value on parameter', () => {
    let [a] = Patterns.match($, 1);
    expect(a).to.equal(1);
  });

  it('must ignore value when wildcard given', () => {
    let [a] = Patterns.match(_, 1);
    expect(a).to.equal(undefined);
  });

  it('must match on multiple values when an array is given', () => {
    let [a, ] = Patterns.match([$, 2, _, 4], [1, 2, 3, 4]);
    expect(a).to.equal(1);
  });

  it('must throw an error when there is no match', () => {
    expect(Patterns.match.bind(Patterns.match, [$, 2, _, 4], 1)).to.throw("No match for: 1");
  });

  it('must match values in object', () => {
    let [a] = Patterns.match({a: [1, $, 3]}, {a: [1, 2, 3]});
    expect(a).to.equal(2);
  });

  it('must match on capture variables', () => {
    let a = 1;

    let [b] = Patterns.match(Patterns.capture(a), 1);
    expect(b).to.equal(1);

    let c = {a: 1};

    let [d] = Patterns.match(Patterns.capture(c), {a: 1});
    expect(d.get("a")).to.equal(1);
  });

  it('must throw an error when capture value does not match', () => {
    let a = 1;
    expect(Patterns.match.bind(Patterns.match, Patterns.capture(a), 2)).to.throw("No match for: 2");
  });
});
