import Colors from './colors.js';
import Vendor from './vendor.build.js';

async function start(files) {
  const results = {
    tests: 0,
    success: 0,
    failed: 0,
  };

  for (const file of files) {
    const mod = await import(file);
    if (mod.default.__elixirscript_test_module__) {
      runTests(mod, results);
    }
  }

  return results;
}

function runSetup(mod, name, incomingContext = new Map()) {
  if (mod.default[name]) {
    const result = mod.default[name](incomingContext);

    return resolveContext(result, incomingContext);
  }

  return incomingContext;
}

function runTeardown(mod, name, incomingContext) {
  if (mod.default[name]) {
    const result = mod.default[name](incomingContext);
  }
}

function resolveContext(context, parentContext) {
  if (context === Symbol.for('ok')) {
    return parentContext;
  } else if (context instanceof Vendor.ErlangTypes.Tuple && context.get(0) === Symbol.for('ok')) {
    return resolveContext(context.get(1), parentContext);
  } else if (context instanceof Map) {
    return new Map([...parentContext, ...context]);
  } else if (Array.isArray(context)) {
    return mergeContextKeywordList(context, parentContext);
  }

  throw new Error('Invalid context');
}

function mergeContextKeywordList(context, parentContext) {
  const newContext = new Map([...parentContext]);

  for (const entry of context) {
    newContext.set(entry.get(0), entry.get(1));
  }

  return newContext;
}

function runTests(mod, results) {
  const contextSetupAll = runSetup(mod, '__elixirscript_test_setup_all');

  for (const key of Object.keys(mod.default)) {
    if (key.startsWith('__elixirscript_test_case')) {
      results.tests++;
      const test = mod.default[key]();
      const result = runTest(mod, test, contextSetupAll, results);

      if (result) {
        results.success++;
      } else {
        results.failed++;
      }
    }
  }

  runTeardown(mod, '__elixirscript_test_teardown_all', contextSetupAll);
}

function runTest(mod, test, incomingContext, results) {
  const context = runSetup(mod, '__elixirscript_test_setup', incomingContext);
  let testPassed = true;
  try {
    test.get(Symbol.for('test'))(context);
    process.stdout.write(Colors.fg.Green + '.' + Colors.Reset);
  } catch (e) {
    process.stdout.write('\n');
    handleError(e, test, results, mod);
    testPassed = false;
  }

  runTeardown(mod, '__elixirscript_test_teardown', context);
  return testPassed;
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
      console.log(Colors.fg.Red, errorMessage, Colors.Reset);
      printErrorLine(left, 'left');
      printErrorLine(right, 'right');
    }
  } else {
    console.log(e);
  }
}

function printErrorLine(value, label = null) {
  if (value && value !== Symbol.for('ex_unit_no_meaningful_value')) {
    if (label) {
      console.log(Colors.fg.Cyan, `${label}:`, Colors.Reset, `${value}`);
    } else {
      console.log(`${value}`, Colors.Reset);
    }
  }
}

export default {
  start,
};
