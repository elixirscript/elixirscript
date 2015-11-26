var SpecialForms = require('../lib/kernel/special_forms');
var expect = require('chai').expect;

describe('SpecialForms', function(){

  describe('map_update', function(){
    it('creates new object', function(){
      const foo = SpecialForms.map({foo: "bar", fizz: "buzz"});
      const bar = SpecialForms.map_update(foo, {baz: "bar", fizz: "fizzbuzz"});

      expect(foo instanceof Object).to.equal(bar instanceof Object);
      expect(foo.foo).to.equal(bar.foo);
      expect(bar.fizz).to.equal("fizzbuzz");
      expect(foo === bar).to.equal(false);
    });

    it('creates new class', function(){
      function MyClass(foo){
        this.foo = foo;
      }

      const foo = new MyClass("bar");
      const bar = SpecialForms.map_update(foo, {baz: "bar", fizz: "fizzbuzz"})

      expect(foo instanceof MyClass).to.equal(bar instanceof MyClass);
      expect(foo.foo).to.equal(bar.foo);
      expect(bar.fizz).to.equal("fizzbuzz");
    });
  });
});
