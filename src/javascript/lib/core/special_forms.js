import Core from '../core';

function* _case(condition, clauses) {
  return Core.Patterns.defmatchGen(...clauses)(condition);
}

function* cond(...clauses) {
  for (const clause of clauses) {
    if (clause[0]) {
      return clause[1]();
    }
  }

  throw new Error();
}

function run_list_generators(generator, generators) {
  if (generators.length === 0) {
    return generator.map(x => {
      if (Array.isArray(x)) {
        return x;
      }
      return [x];
    });
  }
  const list = generators.pop();

  const next_gen = [];
  for (const j of list()) {
    for (const i of generator) {
      next_gen.push([j].concat(i));
    }
  }

  return run_list_generators(next_gen, generators);
}

function* _for(expression, generators, collectable_protocol, into = []) {
  let [result, fun] = collectable_protocol.into(into);

  const generatedValues = run_list_generators(generators.pop()(), generators);

  for (const value of generatedValues) {
    if (yield* expression.guard.apply(this, value)) {
      result = yield* fun(
        result,
        new Core.Tuple(
          Symbol.for('cont'),
          yield* expression.fn.apply(this, value)
        )
      );
    }
  }

  return fun(result, Symbol.for('done'));
}

function* _try(
  do_fun,
  rescue_function,
  catch_fun,
  else_function,
  after_function
) {
  let result = null;

  try {
    result = yield* do_fun();
  } catch (e) {
    let ex_result = null;

    if (rescue_function) {
      try {
        ex_result = yield* rescue_function(e);
        return ex_result;
      } catch (ex) {
        if (ex instanceof Core.Patterns.MatchError) {
          throw ex;
        }
      }
    }

    if (catch_fun) {
      try {
        ex_result = yield* catch_fun(e);
        return ex_result;
      } catch (ex) {
        if (ex instanceof Core.Patterns.MatchError) {
          throw ex;
        }
      }
    }

    throw e;
  } finally {
    if (after_function) {
      yield* after_function();
    }
  }

  if (else_function) {
    try {
      return else_function(result);
    } catch (ex) {
      if (ex instanceof Core.Patterns.MatchError) {
        throw new Error('No Match Found in Else');
      }

      throw ex;
    }
  } else {
    return result;
  }
}

function* _with(...args) {
  let argsToPass = [];
  let successFunction = null;
  let elseFunction = null;

  if (typeof args[args.length - 2] === 'function') {
    [successFunction, elseFunction] = args.splice(-2);
  } else {
    successFunction = args.pop();
  }

  for (let i = 0; i < args.length; i++) {
    const [pattern, func] = args[i];

    const result = yield* func(...argsToPass);

    const patternResult = yield* Core.Patterns.match_or_default_gen(
      pattern,
      result
    );

    if (patternResult == null) {
      if (elseFunction) {
        return elseFunction.call(null, result);
      }
      return result;
    }

    argsToPass = argsToPass.concat(patternResult);
  }

  return successFunction(...argsToPass);
}

function* receive(clauses, timeout = 0, timeoutFn = () => true) {
  return Core.global.__elxirscript_process_system__.receive(
    clauses,
    timeout,
    timeoutFn
  );
}

export default {
  _case,
  cond,
  _for,
  _try,
  _with,
  receive
};
