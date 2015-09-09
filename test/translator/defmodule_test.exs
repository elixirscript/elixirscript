defmodule ElixirScript.Translator.Defmodule.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate empty module" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    js_code = """
    const __MODULE__ = Erlang.atom('Elephant');
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
      const __MODULE__ = Erlang.atom('Elephant');

      let something_else = fun([
        [], 
        function(){
          return null;
        }
      ]);


      let something = fun([
        [], 
        function(){
          return ul;
        }
      ]);

      const ul = JQuery('#todo-list');

      export { something: something };
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
     const __MODULE__ = Erlang.atom('Elephant');

      let something_else = fun([
        [], 
        function(){
          return null;
        }
      ]);


      let something = fun([
        [], 
        function(){
          return null;
        }
      ]);

     export { something: something };
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
         import * as Elephant from 'animals/elephant';
         const __MODULE__ = Erlang.atom('Animals');
         let something_else = fun([[], function()    {
             return     null;
           }]);
         let something = fun([[], function()    {
             return     Elephant.defstruct();
           }]);
         export {
             something: something
       };
         const __MODULE__ = Erlang.atom('Elephant');
         function defstruct(trunk = true)        {
                 return     {
                     [Erlang.atom('__struct__')]: __MODULE__,         [Erlang.atom('trunk')]: trunk
           };
               }
         export {
             defstruct: defstruct
       };

    """

    assert_translation(ex_ast, js_code)
  end

  should "translate modules with 2 inner modules" do
    ex_ast = quote do
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true
        end

        defmodule Bear do
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
        import * as Bear from 'animals/bear';
         import * as Elephant from 'animals/elephant';
         const __MODULE__ = Erlang.atom('Animals');
         let something_else = fun([[], function()    {
             return     null;
           }]);
         let something = fun([[], function()    {
             return     Elephant.defstruct();
           }]);
         export {
             something: something
       };
         const __MODULE__ = Erlang.atom('Elephant');
         function defstruct(trunk = true)        {
                 return     {
                     [Erlang.atom('__struct__')]: __MODULE__,         [Erlang.atom('trunk')]: trunk
           };
               }
         export {
             defstruct: defstruct
       };
         const __MODULE__ = Erlang.atom('Bear');
         function defstruct(trunk = true)        {
                 return     {
                     [Erlang.atom('__struct__')]: __MODULE__,         [Erlang.atom('trunk')]: trunk
           };
               }
         export {
             defstruct: defstruct
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
         import * as Elephant from 'animals/elephant';
         const __MODULE__ = Erlang.atom('Animals');
         let something_else = fun([[], function()    {
             return     null;
           }]);
         let something = fun([[], function()    {
             return     Elephant.defstruct();
           }]);
         export {
             something: something
       };
         import * as Bear from 'animals/elephant/bear';
         const __MODULE__ = Erlang.atom('Elephant');
         function defstruct(trunk = true)        {
                 return     {
                     [Erlang.atom('__struct__')]: __MODULE__,         [Erlang.atom('trunk')]: trunk
           };
               }
         export {
             defstruct: defstruct
       };
         const __MODULE__ = Erlang.atom('Bear');
         function defstruct(trunk = true)        {
                 return     {
                     [Erlang.atom('__struct__')]: __MODULE__,         [Erlang.atom('trunk')]: trunk
           };
               }
         export {
             defstruct: defstruct
       };
    """

    assert_translation(ex_ast, js_code)
  end
end
