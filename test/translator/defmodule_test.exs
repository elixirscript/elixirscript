defmodule ElixirScript.Translator.Defmodule.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate empty module" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
    export {};
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
        @ul JQuery.("#todo-list")

        def something() do
          @ul
        end

        defp something_else() do
        end
      end
    end

    js_code = """
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
         const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     ul;
           }));
         const ul = JQuery('#todo-list');
         export {
             something
       };
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule Elephant do
        alias Icabod.Crane

        def something() do
        end

        defp something_else() do
        end
      end
    end

    js_code = """
         import * as Crane from 'icabod/crane';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
         const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
         export {
             something
       };
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate modules with inner modules" do
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
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Elephant: defstruct
    };

    import * as Elephant from 'animals/elephant';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
    const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return null;
    }));
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return Elephant.Elephant.create(Elixir.Kernel.SpecialForms.map({}));
    }));
    export {
        something
    };

    import * as Elephant from 'animals/elephant';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals.Elephant');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Elephant: defstruct
    };
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate modules with inner module that has inner module" do
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
    import * as Bear from 'elephant/bear';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant.Bear');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Bear: defstruct
    };

    import * as Bear from 'elephant/bear';
    import * as Elephant from 'animals/elephant';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals.Elephant');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Elephant: defstruct
    };

    import * as Elephant from 'animals/elephant';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
    const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return null;
    }));
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return Elephant.Elephant.create(Elixir.Kernel.SpecialForms.map({}));
    }));
    export {
        something
    };

    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Bear');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Bear: defstruct
    };

    import * as Bear from 'elephant/bear';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Elephant: defstruct
    };
    """

    assert_translation(ex_ast, js_code)
  end

  should "Pull out module references and make them into imports if modules listed" do
    ex_ast = quote do
      defmodule Animals do
        Lions.Tigers.oh_my()
      end

      defmodule Lions.Tigers do
        Lions.Tigers.Bears.oh_my()
      end
    end

    js_code = """
     import * as Tigers from 'lions/tigers';
     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
     Elixir.Core.call_property(Tigers,'oh_my');
     export {};

     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Lions.Tigers');
     Elixir.Core.call_property(Lions.Tigers.Bears,'oh_my');
     export {};
    """

    assert_translation(ex_ast, js_code)
  end

  should "ignore aliases already added" do
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
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Lions.Tigers');
         const oh_my = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
         Elixir.Core.call_property(Lions.Tigers.Bears,'oh_my');
         export {
             oh_my
       };

         import * as Tigers from 'lions/tigers';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
         Elixir.Core.call_property(Tigers,'oh_my');
         export {};
    """

    assert_translation(ex_ast, js_code)
  end

  should "import only" do
    ex_ast = quote do
      defmodule Lions.Tigers do
        def oh_my() do
        end

        def oh_my2() do
        end
      end

      defmodule Animals do
        import Lions.Tigers, only: [oh_my: 1]

        oh_my()
      end
    end

    js_code = """
    import * as Tigers from 'lions/tigers';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
    Tigers.oh_my();
    export {};



    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Lions.Tigers');
    const oh_my2 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return null;
    }));
    const oh_my = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return null;
    }));
    export {
        oh_my2,
        oh_my
    };
    """

    assert_translation(ex_ast, js_code)
  end

  should "import except" do
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
    import * as Tigers from 'lions/tigers';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
    Tigers.oh_my2();
    export {};



    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Lions.Tigers');

    const oh_my2 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return null;
    }));

    const oh_my = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([], function() {
        return null;
    }));

    export {
        oh_my2,
        oh_my
    };
    """

    assert_translation(ex_ast, js_code)
  end
end
