import test from 'ava';
import ProcessSystem from '../../lib/core/processes/process_system';

let system = null;

test.beforeEach(() => {
  system = new ProcessSystem();
});

test('spawn process', async (t) => {
  const pid = system.spawn(async () => {
    await system.sleep(Symbol.for('Infinity'));
  });

  t.is(system.list().length, 2);
  t.is(system.list()[1], pid);
});

test('spawn linked process', async (t) => {
  const pid = system.spawn_link(async () => {
    await system.sleep(Symbol.for('Infinity'));
  });

  t.is(system.list().length, 2);
  t.true(system.links.get(pid).has(system.list()[0]));
  t.true(system.links.get(system.list()[0]).has(pid));
});

test('spawn linked process', async (t) => {
  const pid1 = system.spawn_link(async () => {
    await system.pause();
    console.log('1');
    await Math.log2(2);
    await system.pause();
    console.log('2');
    await Math.log2(4);
  });

  const pid2 = system.spawn_link(async () => {
    await system.pause();
    console.log('3');
    await Math.log2(4);
    await system.pause();
    console.log('4');
    await Math.log2(4);
  });

  await system.sleep(Symbol.for('Infinity'));

  t.is(system.list().length, 3);
  t.is(system.list()[1], pid1);
  t.is(system.list()[2], pid2);
});
