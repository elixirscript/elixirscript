var Patterns = require("../lib/core").Patterns;
var Enum = require('../lib/enum');
var SpecialForms = require('../lib/core').SpecialForms;
var expect = require('chai').expect;

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
});
