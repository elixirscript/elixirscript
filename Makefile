.PHONY: compile test clean js_compile elixir_compile elixir_test js_test deps elixir_deps js_deps

default: deps compile

compile: js_compile elixir_compile

js_compile:
	yarn build

elixir_compile:
	mix compile

test: js_compile elixir_test js_test

js_test:
	yarn test

elixir_test:
	mix test --cover
	mix elixirscript.test

clean:
	rm -rf priv/build
	mix clean

deps: elixir_deps js_deps

elixir_deps:
	mix deps.get

js_deps:
	yarn
