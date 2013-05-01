all: lib/d3.v3.min.js lib/topojson.v1.min.js assets/bundle.js

lib/d3.v3.min.js:
	curl -o lib/d3.v3.min.js 'http://d3js.org/d3.v3.min.js'

lib/topojson.v1.min.js:
	curl -o lib/topojson.v1.min.js 'http://d3js.org/topojson.v1.min.js'

# assets/bundle.js:
# 	browserify index.js -o assets/bundle.js

	# in line 3 of node_modules/index.js, change to:
	# var topojson = module.exports = require("./topojson");
	# also
	#  in line 24 of bundle.js
	# module.exports = (function() {
	# from
	# topojson = (function() {

