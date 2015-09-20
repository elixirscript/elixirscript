var expect = require('chai').expect;
var Patterns = require("../../lib/patterns/patterns");

const _ = Patterns.wildcard();
const $ = Patterns.variable();

describe('example', () => {
  it('must correctly evaluate example', () => {

    let fact = Patterns.defmatch(
      {
        pattern: [0],
        fn: () => 1
      },
      {
        pattern: [$],
        fn: (n) => n * fact(n - 1)
      }
    );

    let response = fact(0);
    expect(response).to.equal(1);

    response = fact(10);
    expect(response).to.equal(3628800);
  });
});

describe('defmatch', () => {
  it('must throw error when no match is found', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [0],
        fn: () => 1
      }
    );

    expect(fn.bind(fn, 1)).to.throw("No match for: List [ 1 ]");
  });

  it('must have wildcard except everything', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [_],
        fn: () => 1
      }
    );

    expect(fn(1)).to.equal(1);
    expect(fn("1")).to.equal(1);
    expect(fn("ABC")).to.equal(1);
    expect(fn(() => 34)).to.equal(1);
  });

  it('must work symbols', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [Symbol.for('infinity')],
        fn: () => 1
      }
    );

    expect(fn(Symbol.for('infinity'))).to.equal(1);
    expect(fn.bind(fn, Symbol('infinity'))).to.throw("No match for: List [ Symbol(infinity) ]");
  });

  it('must match on values in object', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [{value: $}],
        fn: (val) => 1 + val
      },
      {
        pattern: [{a: {b: {c: $} } }],
        fn: (val) => 1 - val
      }
    );

    expect(fn({value: 20})).to.equal(21);
    expect(fn({a: {b: {c: 20} } })).to.equal(-19);
  });

  it('must match on objects even when value has more keys', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [{value: $}],
        fn: (val) => 1 + val
      },
      {
        pattern: [{a: {b: {c: $} } }],
        fn: (val) => 1 - val
      }
    );

    expect(fn({value: 20})).to.equal(21);
    expect(fn({a: {b: {c: 20}, d: 10 } })).to.equal(-19);
  });

  it('must match on substrings', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [Patterns.startsWith("Bearer ")],
        fn: (token) => token
      }
    );

    expect(fn("Bearer 1234")).to.equal("1234");
  });


  it('must work with guards', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [$],
        guard: (number) => number > 0,
        fn: (number) => number
      }
    );

    expect(fn(3)).to.equal(3);
    expect(fn.bind(fn, -1)).to.throw("No match for: List [ -1 ]");
  });

  it('must capture entire match as parameter', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [Patterns.capture({a: {b: {c: $} } })],
        fn: (val, bound_value) => bound_value.get("a").get("b").get("c")
      }
    );

    expect(fn({a: {b: {c: 20} } })).to.equal(20);

    fn = Patterns.defmatch(
      {
        pattern: [Patterns.capture([1, $, 3, $])],
        fn: (a, b, bound_value) => bound_value.count()
      }
    );

    expect(fn([1, 2, 3, 4])).to.equal(4);

    fn = Patterns.defmatch(
      {
        pattern: [Patterns.capture([1, Patterns.capture({a: {b: {c: $} } }), 3, $])],
        fn: (c, two, four, arg) =>  two.get("a").get("b").get("c")
      }
    );

    expect(fn([1, {a: {b: {c: 20} } }, 3, 4])).to.equal(20);
  });

  it('must produce a head and a tail', () => {

    let fn = Patterns.defmatch(
      {
        pattern: [Patterns.headTail()],
        fn: (head, tail) => tail
      }
    );

    expect(fn([3, 1, 2, 4]).length).to.equal(3);
  });

  it('must match on type', () => {

    class Tuple {
      constructor(...elems){
        this.value = elems;
      }
    }

    let fn = Patterns.defmatch(
      {
        pattern: [Patterns.type(Tuple, {value: [1, 2, 3]})],
        fn: () => 3
      }
    );

    expect(fn(new Tuple(1, 2, 3))).to.equal(3);


    fn = Patterns.defmatch(
      {
        pattern: [Patterns.type(Tuple, { value: [1, 2, 3] })],
        fn: () => 3
      }
    );

    expect(fn.bind(fn, new Tuple(1, 2, 4))).to.throw("No match for: List [ [object Object] ]");
  });



});