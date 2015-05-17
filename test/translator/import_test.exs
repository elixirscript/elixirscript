defmodule ElixirScript.Translator.Import.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "allow for using a from clause" do
     ex_ast = quote do
      defmodule User do
        import Hello.World, from: "../hello/world"
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import * as World from '../hello/world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)   
  end

  should "translate import" do
    ex_ast = quote do
      defmodule User do
        import Hello.World
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import * as World from 'hello/world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        import US, only: [la: 1, al: 2]
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import { la, al } from 'us';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate alias" do
    ex_ast = quote do
      defmodule User do
        alias Hello.World
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import World from 'hello/world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate alias with from" do
    ex_ast = quote do
      defmodule User do
        alias Hello.World, from: "../hello/world"
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import World from '../hello/world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate alias with as" do
    ex_ast = quote do
      defmodule User do
        alias Hello.World, as: Pizza
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import {default as Pizza } from 'hello/world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate require" do
    ex_ast = quote do
      defmodule User do
        require World
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import World from 'world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule User do
        require Hello.World
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      import World from 'hello/world';

      let User = {};
      export default User;
    """

    assert_translation(ex_ast, js_code)
  end
end