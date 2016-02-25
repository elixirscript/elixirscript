import Core from "../../lib/core";
const Patterns = Core.Patterns;
const Tuple = Core.Tuple;
const BitString = Core.BitString;

import chai from 'chai';
var expect = chai.expect;

const _ = Patterns.wildcard();
const $ = Patterns.variable();

describe('example', () => {
  it('must correctly evaluate example', () => {

    let fact = Patterns.defmatch(
      Patterns.make_case([0], () => 1),
      Patterns.make_case([$], (n) => n * fact(n - 1))
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
      Patterns.make_case([0], () => 1)
    );

    expect(fn.bind(fn, 1)).to.throw("No match for: 1");
  });

  it('must have wildcard except everything', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([_], () => 1)
    );

    expect(fn(1)).to.equal(1);
    expect(fn("1")).to.equal(1);
    expect(fn("ABC")).to.equal(1);
    expect(fn(() => 34)).to.equal(1);
  });

  it('must work symbols', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([Symbol.for('infinity')], () => 1)
    );

    expect(fn(Symbol.for('infinity'))).to.equal(1);
    expect(fn.bind(fn, Symbol('infinity'))).to.throw("No match for: Symbol(infinity)");
  });

  it('must match on values in object', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([{value: $}], (val) => 1 + val),
      Patterns.make_case([{a: {b: {c: $} } }], (val) => 1 - val)
    );

    expect(fn({value: 20})).to.equal(21);
    expect(fn({a: {b: {c: 20} } })).to.equal(-19);
  });

  it('must match on objects even when value has more keys', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([{value: $}], (val) => 1 + val),
      Patterns.make_case([{a: {b: {c: $} } }], (val) => 1 - val)
    );

    expect(fn({value: 20})).to.equal(21);
    expect(fn({a: {b: {c: 20}, d: 10 } })).to.equal(-19);
  });

  it('must match on substrings', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([Patterns.startsWith("Bearer ")], (token) => token)
    );

    expect(fn("Bearer 1234")).to.equal("1234");
  });


  it('must work with guards', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([$], (number) => number, (number) => number > 0)
    );

    expect(fn(3)).to.equal(3);
    expect(fn.bind(fn, -1)).to.throw("No match for: -1");
  });

  it('must capture entire match as parameter', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case([Patterns.capture({a: {b: {c: $} } })], (val, bound_value) => bound_value["a"]["b"]["c"])
    );

    expect(fn({a: {b: {c: 20} } })).to.equal(20);

    fn = Patterns.defmatch(
      Patterns.make_case([Patterns.capture([1, $, 3, $])], (a, b, bound_value) => bound_value.length)
    );

    expect(fn([1, 2, 3, 4])).to.equal(4);

    fn = Patterns.defmatch(
      Patterns.make_case(
        [Patterns.capture([1, Patterns.capture({a: {b: {c: $} } }), 3, $])],
        (c, two, four, arg) =>  two["a"]["b"]["c"]
      )
    );

    expect(fn([1, {a: {b: {c: 20} } }, 3, 4])).to.equal(20);
  });

  it('must produce a head and a tail', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case(
        [Patterns.headTail($, $)],
        (head, tail) => tail
      )
    );

    expect(fn([3, 1, 2, 4]).length).to.equal(3);
  });

  it('must match on tuple', () => {

    let fn = Patterns.defmatch(
      Patterns.make_case(
        [Patterns.type(Tuple, {values: [1, 2, 3]})],
        () => 3
      )
    );

    expect(fn(new Tuple(1, 2, 3))).to.equal(3);
    expect(fn.bind(fn, new Tuple(1, 2, 4))).to.throw("No match for: {1, 2, 4}");
  });

  describe('BitString', () => {
    it('must match on a string', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.integer(102), BitString.integer(111), BitString.integer(111))],
          () => 3
        )
      );

      expect(fn("foo")).to.equal(3);
      expect(fn.bind(fn, "bar")).to.throw("No match for: bar");
    });

    it('must match on a bitstring', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.integer(102), BitString.integer(111), BitString.integer(111))],
          () => 3
        )
      );

      expect(fn(new BitString(BitString.integer(102), BitString.integer(111), BitString.integer(111)))).to.equal(3);
    });

    it('must allow for variables', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.integer({value: $}), BitString.integer(111), BitString.integer(111))],
          (pattern) => pattern
        )
      );

      expect(fn(new BitString(BitString.integer(102), BitString.integer(111), BitString.integer(111)))).to.equal(102);
    });

    it('must match on variable and convert to type', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.integer(102), BitString.binary({value: $}))],
          (b) => b
        )
      );

      expect(fn(new BitString(BitString.integer(102), BitString.integer(111), BitString.integer(111)))).to.equal("oo");
    });

    it('throw error when binary is used without size', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.binary({value: $}), BitString.binary(" the "), BitString.binary({value: $}))],
          (name, species) => name
        )
      );

      expect(fn.bind(fn, "Frank the Walrus")).to.throw("a binary field without size is only allowed at the end of a binary pattern");
    });

    it('allow binary pattern with size', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.size(BitString.binary({value: $}), 5), BitString.binary(" the "), BitString.binary({value: $}))],
          (name, species) => name
        )
      );

      expect(fn("Frank the Walrus")).to.equal("Frank");
    });


    it('allow unsigned integer', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.bitStringMatch(BitString.integer({value: $}))],
          (int) => int
        )
      );

      expect(fn(new BitString(BitString.integer(-100)))).to.equal(156);
    });
  });


  describe('Optional Arguments', () => {
    it('single optional argument', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.variable(2)],
          (arg) => arg
        )
      );

      expect(fn()).to.equal(2);
      expect(fn(3)).to.equal(3);
    });


    it('single optional argument and one required argument', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.variable(), Patterns.variable(2)],
          (arg1, arg2) => arg1 + arg2
        )
      );

      expect(fn.bind(fn)).to.throw("No match for:");
      expect(fn(1)).to.equal(3);
      expect(fn(3, 4)).to.equal(7);
    });

    it('two optional arguments and one required argument', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.variable(3), Patterns.variable(), Patterns.variable(2)],
          (arg1, arg2, arg3) => arg1 + arg2 + arg3
        )
      );

      expect(fn(1)).to.equal(6);
      expect(fn(3, 4)).to.equal(9);
    });


    it('two optional arguments in between 2 required', () => {

      let fn = Patterns.defmatch(
        Patterns.make_case(
          [Patterns.variable(), Patterns.variable(2), Patterns.variable(3), Patterns.variable()],
          (arg1, arg2, arg3, arg4) => arg1 + arg2 + arg3 + arg4
        )
      );

      expect(fn(1, 4)).to.equal(10);
      expect(fn(1, 5, 4)).to.equal(13);
      expect(fn(1, 5, 7, 4)).to.equal(17);
    });
  });


});
