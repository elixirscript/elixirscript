import test from 'ava';
import Elixir from '../build/elixirscript.build.js';

const sinon = require('sinon');

test('Elixir.start:calls the modules start function', async t => {
  const callback = sinon.spy();

  await Elixir.start(Elixir.Main, [callback]);

  t.true(callback.called);
});
