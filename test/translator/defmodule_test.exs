defmodule ElixirScript.Translator.Defmodule.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate empty module" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    js_code = """
    const values = {};
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
         const something_else = Elixir.Core.Patterns.defmatchgen(Elixir.Core.Patterns.clause([],function*()    {
             return     null;
           }));
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
             return     ul;
           }));
         const ul = JQuery('#todo-list');
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
    const Elixir$Animals$Elephant = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.Animals.Elephant'),     [Symbol.for('trunk')]: true
    });
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
    const Elixir$Animals$Elephant$Bear = Elixir.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.Animals.Elephant.Bear'),
        [Symbol.for('trunk')]: true
  });
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
    Elixir.Core.Functions.call_property(Lions.Tigers.Bears,'oh_my');
    """

    assert_translation(ex_ast, js_code)
  end

end
