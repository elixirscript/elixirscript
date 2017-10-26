require = require('./esm/index.js')(module, { cjs: true, esm: 'js' });
const runner = require('./testRunner.js').default;

const testFiles = process.argv.slice(2);
runner.start(testFiles).then((results) => {
  process.stdout.write('\n\n');
  process.stdout.write(`${results.tests} tests, ${results.success} succeeded, ${results.failed} failed\n`);

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
