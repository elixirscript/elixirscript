import test from 'ava';
const sinon = require('sinon');

const Elixir = require('../build/Elixir.App');

test('Elixir.start:calls the modules start function', t => {
  const callback = sinon.spy();

  Elixir.start(Elixir.Main, callback);

  t.true(callback.called);
});

test('Elixir.load:loads the modules exports', async t => {
  const main = Elixir.load(Elixir.Main);

  t.truthy(main.start);
  t.truthy(main.hello);
  t.is(await main.hello(), 'Hello!');
});
