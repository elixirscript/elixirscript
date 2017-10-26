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
        process.stdout.write('.');
      } catch (e) {
        results.failed++;
        handleError(e, test, results, mod);
      }
    }
  }
}

function handleError(e, test, results, mod) {
  if (e.__reason) {
    if (e.__reason instanceof Map && e.__reason.get(Symbol.for('message'))) {
      const errorMessage = e.__reason.get(Symbol.for('message'));
      const expr = e.__reason.get(Symbol.for('expr'));
      const left = e.__reason.get(Symbol.for('left'));
      const right = e.__reason.get(Symbol.for('right'));
      const moduleName = Symbol.keyFor(mod.default.__MODULE__).replace('Elixir.', '');
      let testMessage = test.get(Symbol.for('message'));
      testMessage = `${results.failed}) ${testMessage} (${moduleName})`;

      printErrorLine(testMessage);
      printErrorLine(errorMessage);
      printErrorLine(left, 'left');
      printErrorLine(right, 'right');
    }
  } else {
    console.error(e.message);
  }
}

function printErrorLine(value, label = null) {
  if (value !== Symbol.for('ex_unit_no_meaningful_value')) {
    if (label) {
      console.error(`${label}: ${value}`);
    } else {
      console.error(`${value}`);
    }
  }
}

export default {
  start,
};
