#!/usr/bin/env node

var fs       = require("fs");
var UglifyJS = require("./vendor/UglifyJS/uglify-js");
var stitch   = require("stitch");
var package  = stitch.createPackage({ paths: [__dirname + "/lib", __dirname + "/vendor/UglifyJS/lib"] });
var metadata = JSON.parse(fs.readFileSync(__dirname + "/package.json"));

package.compile(function(err, source) {
	if (err) throw err;
	var uglify = UglifyJS.uglify;

	function compress(code, pretty) {
		if (!pretty) {
			return uglify.gen_code(
				uglify.ast_squeeze(
					uglify.ast_mangle(
						UglifyJS.parser.parse(
							code))));
		} else {
			return uglify.gen_code(
				UglifyJS.parser.parse(code), {beautify: true});
		}
	};

	var mainSource = compress("(function(window) {" + source + ";" +
							  "window.Uglybox = this.require('.')" +
							  "}).call({}, this)", true);

	var bootstrapSource = compress(fs.readFileSync(__dirname + "/lib/bootstrap.js").toString(), false);
	bootstrapSource = bootstrapSource.replace(/[\\"']/g, '\\$&');


	process.stdout.write(
		"/*! Uglybox v" + metadata.version + "\n" +
		" * https://github.com/justmoon/uglybox/\n" +
		" *\n"  +
		" * (c) 2011 Stefan Thomas\n" +
		" * Dual-licensed under MIT and GPL licenses\n" +
		" */\n" +
		"var bootstrapCode = '"+bootstrapSource+"';\n" +
		mainSource +
		";\n"
	);
});
