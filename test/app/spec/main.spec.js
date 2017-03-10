const expect = require('chai').expect;
const sinon = require('sinon');

const Elixir = require('../build/Elixir.App');

describe('Elixir.start', function () {
  it('calls the modules start function', function () {
    const callback = sinon.spy();

    Elixir.start(Elixir.Main, callback);

    expect(callback).to.have.been.calledWith('started');
  });
});

describe('Elixir.load', function () {
  it('loads the modules exports', function () {
    const main = Elixir.load(Elixir.Main);

    expect(main).to.have.property('start');
    expect(main).to.have.property('hello');
    expect(main.hello()).to.eq('Hello!');
  });
});
