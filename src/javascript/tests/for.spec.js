import Core from "../lib/core";
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;
const BitString = Core.BitString;

import Enum from "../lib/enum";

import chai from "chai";
var expect = chai.expect;

const $ = Patterns.variable();

describe("for", () => {
  it("simple for", () => {
    let gen = Patterns.list_generator($, [1, 2, 3, 4]);
    let result = SpecialForms._for(Patterns.clause([$], x => x * 2), [gen]);

    expect(result).to.eql([2, 4, 6, 8]);
  });

  it("for with multiple generators", () => {
    //for x <- [1, 2], y <- [2, 3], do: x*y

    let gen = Patterns.list_generator($, [1, 2]);
    let gen2 = Patterns.list_generator($, [2, 3]);
    let result = SpecialForms._for(Patterns.clause([$, $], (x, y) => x * y), [
      gen,
      gen2
    ]);

    expect(result).to.eql([2, 3, 4, 6]);
  });

  it("for with filter", () => {
    //for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    let gen = Patterns.list_generator($, [1, 2, 3, 4, 5, 6]);
    let result = SpecialForms._for(
      Patterns.clause([$], x => x, x => x % 2 === 0),
      [gen]
    );

    expect(result).to.eql([2, 4, 6]);
  });

  it("for with pattern matching", () => {
    //for {:user, name} <- [user: "john", admin: "john", user: "meg"], do
    // String.upcase(name)
    //end

    let gen = Patterns.list_generator([Symbol.for("user"), $], [
      [Symbol.for("user"), "john"],
      [Symbol.for("admin"), "john"],
      [Symbol.for("user"), "meg"]
    ]);

    let result = SpecialForms._for(
      Patterns.clause([[Symbol.for("user"), $]], name => name.toUpperCase()),
      [gen]
    );

    expect(result).to.eql(["JOHN", "MEG"]);
  });

  it("for with bitstring", () => {
    //for <<r::8, g::8, b::8 <- <<213, 45, 132, 64, 76, 32, 76, 0, 0, 234, 32, 15>> >>, do: {r, g, b}

    let gen = Patterns.bitstring_generator(
      Patterns.bitStringMatch(
        BitString.integer({ value: $ }),
        BitString.integer({ value: $ }),
        BitString.integer({ value: $ })
      ),
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
    );

    let expression = Patterns.clause(
      [
        Patterns.bitStringMatch(
          BitString.integer({ value: $ }),
          BitString.integer({ value: $ }),
          BitString.integer({ value: $ })
        )
      ],
      (r, g, b) => new Tuple(r, g, b)
    );

    let result = SpecialForms._for(expression, [gen]);

    expect(result).to.eql([
      new Tuple(213, 45, 132),
      new Tuple(64, 76, 32),
      new Tuple(76, 0, 0),
      new Tuple(234, 32, 15)
    ]);
  });
});
