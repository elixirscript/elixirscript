defmodule ElixirScript.Translator.Defmodule.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate empty module" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    export default {};
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
        @ul JQuery.("#todo-list")

        def something() do
          @ul
        end

        defgenp something_else() do
        end
      end
    end

    js_code = """

        import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const something_else = Elixir.Core.Patterns.defmatchgen(Elixir.Core.Patterns.clause([],function*()    {
             return     null;
           }));
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
             return     ul;
           }));
         const ul = JQuery('#todo-list');
         export default {
             something
       };
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate modules with inner modules" do
    ex_ast = quote do
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true
        end

        def something() do
          %Elephant{}
        end

        defp something_else() do
        end

      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Animals$Elephant from './Elixir.Animals.Elephant';
    const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
      return     null;
    }));

    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
      return     Elixir$Animals$Elephant.Elixir$Animals$Elephant.create(Object.freeze({}));
    }));

    export default {
      something
    };

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const Elixir$Animals$Elephant = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.Animals.Elephant'),     [Symbol.for('trunk')]: true
    });

    export default {
      Elixir$Animals$Elephant
    };
    """

    assert_translation(ex_ast, js_code)
  end


  test "translate modules with inner module that has inner module" do
    ex_ast = quote do
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true

          defmodule Bear do
            defstruct trunk: true
          end
        end


        def something() do
          %Elephant{}
        end

        defp something_else() do
        end

      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Animals$Elephant from './Elixir.Animals.Elephant';
    const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
        return     null;
      }));
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
        return     Elixir$Animals$Elephant.Elixir$Animals$Elephant.create(Object.freeze({}));
      }));

    export default {
        something
  };

  import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
  import Elixir$Animals$Elephant$Bear from './Elixir.Animals.Elephant.Bear';
    const Elixir$Animals$Elephant = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.Animals.Elephant'),
        [Symbol.for('trunk')]: true
  });
    export default {
        Elixir$Animals$Elephant
  };

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const Elixir$Animals$Elephant$Bear = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.Animals.Elephant.Bear'),
        [Symbol.for('trunk')]: true
  });

    export default {
        Elixir$Animals$Elephant$Bear
  };
    """

    assert_translation(ex_ast, js_code)
  end

  test "Pull out module references and make them into imports if modules listed" do
    ex_ast = quote do
      defmodule Animals do
        Lions.Tigers.oh_my()
      end

      defmodule Lions.Tigers do
        Lions.Tigers.Bears.oh_my()
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Lions$Tigers from './Elixir.Lions.Tigers';
    Elixir.Core.Functions.call_property(Elixir$Lions$Tigers,'oh_my');
    export default {};

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    Elixir.Core.Functions.call_property(Lions.Tigers.Bears,'oh_my');
    export default {};
    """

    assert_translation(ex_ast, js_code)
  end

  test "ignore aliases already added" do
    ex_ast = quote do
      defmodule Animals do
        alias Lions.Tigers

        Tigers.oh_my()
      end

      defmodule Lions.Tigers do
        Lions.Tigers.Bears.oh_my()

        def oh_my() do
        end
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Lions$Tigers from './Elixir.Lions.Tigers';
    Elixir.Core.Functions.call_property(Elixir$Lions$Tigers,'oh_my');
    export default {};

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const oh_my = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
        return     null;
      }));
    Elixir.Core.Functions.call_property(Lions.Tigers.Bears,'oh_my');
    export default {
      oh_my
    };
    """

    assert_translation(ex_ast, js_code)
  end

  test "import only" do
    ex_ast = quote do
      defmodule Lions.Tigers do
        def oh_my() do
        end

        def oh_my2() do
        end
      end

      defmodule Animals do
        import Lions.Tigers, only: [oh_my: 0]

        oh_my()
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Lions$Tigers from './Elixir.Lions.Tigers';
    Elixir$Lions$Tigers.oh_my();
    export default {};

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const oh_my2 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
      return     null;
    }));

    const oh_my = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
      return     null;
    }));

    export default {
      oh_my2,     oh_my
    };
    """

    assert_translation(ex_ast, js_code)
  end

  test "import except" do
    ex_ast = quote do
      defmodule Lions.Tigers do
        def oh_my() do
        end

        def oh_my2() do
        end
      end

      defmodule Animals do
        import Lions.Tigers, except: [oh_my: 1]

        oh_my2()
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Lions$Tigers from './Elixir.Lions.Tigers';
    Elixir$Lions$Tigers.oh_my2();
    export default {};

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    const oh_my2 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
      return     null;
    }));

    const oh_my = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
      return     null;
    }));

    export default {
      oh_my2,
      oh_my
    };
    """

    assert_translation(ex_ast, js_code)
  end


  test "translate inner module has another inner module alias" do
    ex_ast = quote do
      defmodule Version do
        defmodule Parser do
          import Parser.DSL
        end

        defmodule Parser.DSL do

        end
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Version$Parser from './Elixir.Version.Parser';
    import Elixir$Version$Parser$DSL from './Elixir.Version.Parser.DSL';
    export default {};

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Version$Parser$DSL from './Elixir.Version.Parser.DSL';
    export default {};

    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import Elixir$Version$Parser from './Elixir.Version.Parser';
    export default {};
    """

    assert_translation(ex_ast, js_code)
  end

end
