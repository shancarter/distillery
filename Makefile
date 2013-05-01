GENERATED_FILES = \
	lib.js

all: $(GENERATED_FILES)

lib.js: index.js
	node_modules/.bin/browserify -t brfs node_modules/topojson/index.js index.js -o $@

clean:
	rm -f -- $(GENERATED_FILES)
