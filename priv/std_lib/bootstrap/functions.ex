defmodule ElixirScript.Bootstrap.Functions do

  def contains(left, []) do
    false
  end

  def contains(left, [right]) do
    match?(left, right)
  end

  def contains(left, [h|t]) do   
    case match?(left, h) do
      true ->
        true
      false ->
        contains(left, t)
    end
  end

  def get_object_keys(obj) do
    JS.Object.keys(obj).concat(JS.Object.getOwnPropertySymbols(obj))
  end

  def is_valid_character(codepoint) do
    try do
      JS.String.fromCodePoint(codepoint) != nil
    rescue
      _ ->
        false
    end
  end

  def b64EncodeUnicode(str) do
    {:ok, regex} = Regex.compile("%([0-9A-F]{2})", "g")

    JS.btoa(
      JS.encodeURIComponent(str).replace(regex, fn (match, p1) ->
        JS.String.fromCharCode("0x#{p1}")
      end)
    )
  end

  def reverse(list) do
    list.concat([]).reverse()
  end

 def class_to_obj(map) do
   JS.Object.assign(JS.new(JS.Object, []), map)
   |> JS.Object.freeze
 end

def delete_property_from_map(map, property) do
  new_map = JS.Object.assign(JS.Object.create(map.constructor.prototype), map)
  JS.delete(new_map[property])

  JS.Object.freeze(new_map)
end

def add_property_to_map(map, property, value) do
  JS.Object.assign(JS.new(JS.Object, []), map)
  |> JS.update(property, value)
  |> JS.Object.freeze
end

end
