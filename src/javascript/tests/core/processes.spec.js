import test from 'ava';
import Patterns from 'tailored';
import ProcessSystem from '../../lib/core/processes/process_system';

let system = null;

test.beforeEach(() => {
  system = new ProcessSystem();
});

test('spawn linked process', async (t) => {
  // spawn one process
  const pid1 = system.spawn_link(async () => {
    const arg = Patterns.clause([Patterns.variable()], async x => console.log(x));

    await system.pause();
    console.log(`first process ${system.pid()}`);
    await system.receive([arg]);
    console.log(`first process ${system.pid()}`);
    await Math.log2(2);
    await system.pause();
    console.log(`first process ${system.pid()}`);
    await Math.log2(4);
  });

  // spawn another process
  const pid2 = system.spawn_link(async () => {
    await system.pause();
    console.log(`second process ${system.pid()}`);
    await Math.log2(4);
    await system.pause();
    console.log(`second process ${system.pid()}`);
    await system.send(pid1, 'This message was sent');
    console.log(`second process ${system.pid()}`);
    await Math.log2(4);
  });

  console.log(`first process pid should be ${pid1}`);
  console.log(`first process pid should be ${pid2}`);

  t.is(system.list().length, 3);
  t.is(system.list()[1], pid1);
  t.is(system.list()[2], pid2);
});
