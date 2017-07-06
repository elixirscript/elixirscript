defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    JS.fetch("/api/todo").then(fn(response) ->
      response.json()
    end).catch(fn(err) ->
      :console.debug(err)
    end)
  end
end
