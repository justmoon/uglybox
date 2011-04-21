all: dist

dist: dist/uglybox.js

dist/uglybox.js: lib/*.js
	@echo Compiling dist/uglybox.js...
	@mkdir -p dist
	@node build.js > dist/uglybox.js

clean:
	@rm -f dist/uglybox.js
