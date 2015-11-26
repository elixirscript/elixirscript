function bnot(expr){
  return ~expr;
}

function band(left, right){
  return left & right;
}

function bor(left, right){
  return left | right;
}

function bsl(left, right){
  return left << right;
}

function bsr(left, right){
  return left >> right;
}

function bxor(left, right){
  return left ^ right;
}

export default {
  bnot,
  band,
  bor,
  bsl,
  bsr,
  bxor
}