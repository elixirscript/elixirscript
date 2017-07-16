defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    opts = %{width: 10, height: 15}
    with {:ok, width} <- Map.fetch(opts, :width),
         {:ok, height} <- Map.fetch(opts, :height)
    do
         {:ok, width * height}
    else
      :error ->
       {:error, :wrong_data}
    end
  end
end
