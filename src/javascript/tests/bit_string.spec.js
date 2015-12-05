var BitString = require('../lib/core').BitString;
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('BitString', function(){

  describe('creation', function(){
    it('create properly', function(){
      let bs = Kernel.SpecialForms.bitstring(BitString.integer(1));
      expect(Kernel.match__qmark__(bs.value, [1])).to.equal(true);

      bs = Kernel.SpecialForms.bitstring(BitString.binary("foo"));
      expect(Kernel.match__qmark__(bs.value, [102, 111, 111])).to.equal(true);

      bs = Kernel.SpecialForms.bitstring(BitString.integer(0), BitString.binary("foo"));
      expect(Kernel.match__qmark__(bs.value, [0, 102, 111, 111])).to.equal(true);

      bs = Kernel.SpecialForms.bitstring(BitString.float(3.14));
      expect(Kernel.match__qmark__(bs.value, [64, 9, 30, 184, 81, 235, 133, 31])).to.equal(true);

      bs = Kernel.SpecialForms.bitstring(BitString.signed(BitString.integer(-100)));
      expect(Kernel.match__qmark__(bs.value, [156])).to.equal(true);
    });
  });

  describe('UTF conversions', function(){
    it('toUTF8Array', function(){
      let bs = BitString.toUTF8Array("fo≈");
      expect(Kernel.match__qmark__(bs, [102, 111, 226, 137, 136])).to.equal(true);
    });

    it('toUTF16Array', function(){
      let bs = BitString.toUTF16Array("fo≈");
      expect(Kernel.match__qmark__(bs, [0, 102, 0, 111, 34, 72])).to.equal(true);
    });

    it('toUTF32Array', function(){
      let bs = BitString.toUTF32Array("fo≈");
      expect(Kernel.match__qmark__(bs, [0, 0, 0, 102, 0, 0, 0, 111, 0, 0, 34, 72])).to.equal(true);
    });
  });

  describe('Float conversions', function(){
    it('float32ToBytes', function(){
      let bs = BitString.float32ToBytes(3.14);
      expect(Kernel.match__qmark__(bs, [64, 72, 245, 195])).to.equal(true);
    });

    it('float64ToBytes', function(){
      let bs = BitString.float64ToBytes(3.14);
      expect(Kernel.match__qmark__(bs, [64, 9, 30, 184, 81, 235, 133, 31])).to.equal(true);
    });
  });
});
