async function start(files) {
  const results = {
    tests: 0,
    success: 0,
    failed: 0,
  };

  for (const file of files) {
    const mod = await import(file);
    if (mod.default.__elixir_script_test_module__) {
      runTests(mod, results);
    }
  }

  return results;
}

function runTests(mod, results) {
  const context = [];

  for (const key of Object.keys(mod.default)) {
    if (key.startsWith('__test_')) {
      results.tests++;
      const test = mod.default[key](context);
      try {
        test.get(Symbol.for('test'))(context);
        results.success++;
      } catch (e) {
        handleError(e);
        results.failed++;
      }
    }
  }
}

function handleError(e) {
  if (e.__reason) {
    if (e.__reason instanceof Map && e.__reason.get(Symbol.for('message'))) {
      console.error(e.__reason.get(Symbol.for('message')));
      console.error(e.__reason.get(Symbol.for('expr')).toString());
      console.error(e.__reason.get(Symbol.for('left')).toString());
      console.error(e.__reason.get(Symbol.for('right')).toString());
    }
  } else {
    console.error(e.message);
  }
}

export default {
  start,
};
