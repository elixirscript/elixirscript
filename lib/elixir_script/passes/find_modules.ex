defmodule ElixirScript.Passes.FindModules do
  @moduledoc false
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.State

  @spec execute(map, map) :: map
  def execute(compiler_data, opts) do
    data = Enum.reduce(compiler_data.data, [], fn(data, list) ->
      quoted = update_quoted(data.ast)
      { _, modules } = Macro.postwalk(quoted, [], &get_defmodules(&1, &2, opts, compiler_data))

      modules = Enum.map(modules, fn(x) -> { x.name, Map.merge(data, x) } end)
      list ++ modules
    end)

    Map.put(compiler_data, :data, data)
  end

  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: {:__block__, _, _} = block]]} = ast, state, _, _) do
    s = %{ name:  Utils.quoted_to_name(the_alias),  type: :protocol, ast: block }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: spec]]} = ast, state, _, _) do
    s = %{ name:  Utils.quoted_to_name(the_alias),  type: :protocol, ast: {:__block__, [], [spec]} }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defimpl, _, [ the_alias, [for: {:__aliases__, _, type_name} = type],  [do: {:__block__, context, spec}] ]} = ast, state, _, compiler_data) do
    {:__aliases__, _, original_name} = Utils.name_to_quoted(State.get_module_name(compiler_data.state, the_alias))
    name = original_name ++ [DefImpl] ++ [Elixir] ++ type_name
    s =  %{name:  Utils.quoted_to_name({:__aliases__, [], name}), type: :impl, for: type, ast: {:__block__, context, spec}, implements: Utils.quoted_to_name({:__aliases__, [], original_name}) }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defimpl, _, [ the_alias, [for: {:__aliases__, _, type_name} = type],  [do: spec] ]} = ast, state, _, compiler_data) do
    {:__aliases__, _, original_name} = Utils.name_to_quoted(State.get_module_name(compiler_data.state, the_alias))
    name = original_name ++ [DefImpl] ++ [Elixir] ++ type_name
    s =  %{name:  Utils.quoted_to_name({:__aliases__, [], name}), type: :impl, for: type, ast: {:__block__, [], [spec]}, implements: Utils.quoted_to_name({:__aliases__, [], original_name}) }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defmodule, _, [{:__aliases__, _, [:ElixirScript, :Temp]}, [do: body]]} = ast, state, _, _) do
    s = %{name: ElixirScript.Temp, type: :module, ast: body }
    { ast, state ++ [s] }
  end


  defp get_defmodules({:defmodule, _, [{:__aliases__, _, _}, [do: _]]} = ast, state, opts, _) do
    { ast, do_module_processing(ast, state, opts) }
  end

  defp get_defmodules(ast, state, _, _) do
    { ast, state }
  end


  defp do_module_processing({:defmodule, _context1, [{:__aliases__, _, name} = the_alias, [do: body]]}, state, opts) do
    { body, inner_modules } = make_inner_module_aliases(body)

    aliases = Enum.map(inner_modules, fn
      ({:defmodule, _, [{:__aliases__, _, inner_module_name}, [do: _inner_module_body]]}) ->
        { :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}, [as: {:__aliases__, [alias: false], inner_module_name }] ] }
    end)

    state = do_module_processing_state(inner_modules, state, name, aliases, opts)

    [%{name: Utils.quoted_to_name(the_alias), type: :module, ast: do_module_processing_body(body, aliases, opts) }] ++ state
  end

  defp do_module_processing_state(inner_modules, state, name, aliases, opts) do
    Enum.reduce(inner_modules, state, fn
      ({:defmodule, context1, [{:__aliases__, context2, inner_module_name}, [do: inner_module_body]]}, state) ->

        module_name = Utils.quoted_to_name({:__aliases__, [], tl(name) ++ inner_module_name})
        state = Enum.reject(state, fn(x) -> x.name == module_name end)

        this_module_aliases = aliases -- [{ :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}, [as: {:__aliases__, [alias: false], inner_module_name }] ] }]

        do_module_processing(
          {:defmodule, context1, [{:__aliases__, context2, name ++ inner_module_name}, [do: add_aliases_to_body(inner_module_body, this_module_aliases)]]},
          state, opts)
    end)
  end

  defp do_module_processing_body(body, aliases, opts) do
    body
    |> case do
      {:__block__, context, list } ->
        list =
          list
          |> Enum.map(fn
            {:use, _, [module, _] } = using ->
              {:use, handle_use_expression(using, module, opts) }
            {:use, _, [module] } = using ->
              {:use, handle_use_expression(using, module, opts) }
            ast ->
              {:expanded, ast}
          end)
          |> Enum.reduce([], fn
            {:use, {:__block__, _, list}}, state ->
              state ++ list
            {:use, ast}, state ->
              state ++ [ast]
            {:expanded, ast}, state ->
              state ++ [ast]
          end)

          {:__block__, context, list}
      _ ->
        body
    end
    |> add_aliases_to_body(aliases)
  end

  defp add_aliases_to_body(body, aliases) do
    case body do
      { :__block__, context, body } ->
        { :__block__, context, aliases ++ List.wrap(body) }
      _ ->
        { :__block__, [], aliases ++ List.wrap(body) }
    end
  end

  defp make_inner_module_aliases(body) do
    case body do
      nil ->
        { { :__block__, [], [] }, [] }

      {:__block__, context, list2 } ->
        { list2, inner_modules } = Enum.partition(list2, fn
          {:defmodule, _, [{:__aliases__, _, _inner_module_name}, [do: _inner_module_body]]} ->
            false
          _ ->
            true
      end)

        { {:__block__, context, list2}, inner_modules }
      {:defmodule, _, [{:__aliases__, context, _inner_module_name}, [do: _inner_module_body]]} = mod ->
        { {:__block__, context, [] }, [mod] }
      _ ->
        { body, [] }
    end
  end

  defp handle_use_expression(using_ast, module, opts) do
    module = Utils.quoted_to_name(module)

    eval = """
    require #{inspect module}
    __ENV__
    """
    {env, _} = Code.eval_string(eval, [], opts.env)


    case Macro.expand(using_ast, env) do
      {:__block__, _,
       [{:__block__, _,
         [{:require, _, _},
           {{:., _, [_, :__using__]}, _, _} = ast]}]} ->
        Macro.expand_once(ast, env)
    end
  end

  defp update_quoted(quoted) do
    Macro.prewalk(quoted, fn
      ({name, context, parms}) ->
        context =
          if context[:import] == Kernel do
            Keyword.update!(context, :import, fn(_) -> ElixirScript.Kernel end)
          else
            context
          end

        {name, context, parms}
      (x) ->
        x
    end)
  end

end
