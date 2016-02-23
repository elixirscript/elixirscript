import Core from "../lib/core";
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;
const BitString = Core.BitString;

import Enum from "../lib/enum";

import chai from 'chai';
var expect = chai.expect;

const $ = Patterns.variable();

describe('for', () => {
  it('simple for', () => {
    let collections = [
      [$, [1, 2, 3, 4]]
    ];

    let result = SpecialForms._for(collections, (n) => n * 2);

    expect(result).to.eql([2, 4, 6, 8]);
  });

  it('for with multiple generators', () => {
    //for x <- [1, 2], y <- [2, 3], do: x*y
    let collections = [
      [$, [1, 2]],
      [$, [2, 3]]
    ];

    let result = SpecialForms._for(collections, (x, y) => x * y);

    expect(result).to.eql([2, 3, 4, 6]);
  });


  it('for with filter', () => {
    //for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    let collections = [
      [$, [1, 2, 3, 4, 5, 6]]
    ];

    let result = SpecialForms._for(collections, (n) => n, (n) => n % 2 == 0);

    expect(result).to.eql([2, 4, 6]);
  });

  it('for with pattern matching', () => {
    //for {:user, name} <- [user: "john", admin: "john", user: "meg"], do
    // String.upcase(name)
    //end
    let collections = [
      [[Symbol.for("user"), $], [[Symbol.for("user"), "john"], [Symbol.for("admin"), "john"], [Symbol.for("user"), "meg"]]]
    ];

    let result = SpecialForms._for(collections, (name) => name.toUpperCase());

    expect(result).to.eql(["JOHN", "MEG"]);
  });


  it('for with bitstring', () => {
    //for <<r::8, g::8, b::8 <- <<213, 45, 132, 64, 76, 32, 76, 0, 0, 234, 32, 15>> >>, do: {r, g, b}
    
    let collections = [
      [
        Patterns.bitStringMatch(BitString.integer({value: $}), BitString.integer({value: $}), BitString.integer({value: $})),
        new BitString(
          BitString.integer(213),
          BitString.integer(45),
          BitString.integer(132),
          BitString.integer(64),
          BitString.integer(76),
          BitString.integer(32),
          BitString.integer(76),
          BitString.integer(0),
          BitString.integer(0),
          BitString.integer(234),
          BitString.integer(32),
          BitString.integer(15)
        )
      ]
    ];

    let result = SpecialForms._for(collections, (r, g, b) => new Tuple(r, g, b));

    expect(result).to.eql([new Tuple(213, 45, 132), new Tuple(64, 76, 32), new Tuple(76, 0, 0), new Tuple(234, 32, 15)]);
  });

});
