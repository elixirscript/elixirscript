var Immutable = require("../lib/immutable/immutable");
var Patterns = require("../lib/patterns/patterns");
var Enum = require('../lib/enum');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

const $ = Patterns.variable();

describe('for', () => {
  it('something', () => {
    //for n <- [1, 2, 3, 4], do: n * 2
    let collections = Immutable.fromJS([
      [$, [1, 2, 3, 4]]
    ]);

    let result = Kernel.SpecialForms._for(collections, (n) => n * 2);

    expect(result).to.equal([2, 4, 6, 8]);
  });

  it('something else', () => {
    //for x <- [1, 2], y <- [2, 3], do: x*y
    let collections = Immutable.fromJS([
      [$, [1, 2]],
      [$, [2, 3]]
    ]);

    let result = Kernel.SpecialForms._for(collections, (x, y) => x * y);

    expect(result).to.equal([2, 3, 4, 6]);
  });


  it('something 3', () => {
    //for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    let collections = Immutable.fromJS([
      [$, [1, 2, 3, 4, 5, 6]]
    ]);

    let result = Kernel.SpecialForms._for(collections, (n) => n, (n) => n % 2 == 0);

    expect(result).to.equal([2, 4, 6]);
  });

  it('something 4', () => {
    //for {:user, name} <- [user: "john", admin: "john", user: "meg"], do
    // String.upcase(name)
    //end
    let collections = Immutable.fromJS([
      [[Symbol.for("user"), $], [[Symbol.for("user"), "john"], [Symbol.for("admin"), "john"], [Symbol.for("user"), "meg"]]]
    ]);

    let result = Kernel.SpecialForms._for(collections, (name) => name.toUpperCase());

    expect(result).to.equal(["JOHN", "MEG"]);
  });
});