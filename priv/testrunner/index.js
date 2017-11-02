require = require('./esm/index.js')(module, { cjs: true, esm: 'js' });
const runner = require('./testRunner.js').default;
const Colors = require('./colors.js').default;

const testFiles = process.argv.slice(2);
console.time('Finished in');
runner.start(testFiles).then((results) => {
  const testsFailed = results.failed > 0;

  process.stdout.write('\n\n');
  console.timeEnd('Finished in');
  console.log(
    testsFailed ? Colors.fg.Red : Colors.fg.Green,
    `${results.tests} tests, ${results.success} succeeded, ${results.failed} failed\n`,
    Colors.Reset,
  );

  if (testsFailed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
