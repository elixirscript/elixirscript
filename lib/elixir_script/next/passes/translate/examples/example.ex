defmodule Example do
  def start(v, _) do
    case v do
      :normal ->
        "yolo"
      _ ->
        "yolo too"
    end
  end
end
