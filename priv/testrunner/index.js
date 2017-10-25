require = require('./esm/index.js')(module, { cjs: true, esm: 'js' });
const runner = require('./testRunner.js').default;

const testFiles = process.argv.slice(2);
runner.start(testFiles).then((results) => {
  console.log(`${results.tests} tests, ${results.success} succeeded, ${results.failed} failed`);

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
