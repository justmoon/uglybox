var Sandbox = require('../lib/sandbox').Sandbox;
var rl = require('readline');
var util = require('util');

function REPLExample() {
	this.box = new Sandbox();
	process.stdin.resume();
	process.stdout.write("Uglybox Shell - Try and break out! ;)\n");
	process.stdout.write("Press Ctrl+C to exit when you're done.\n");
	this.rli = rl.createInterface(process.stdin, process.stdout);
	this.rli.setPrompt("> ");

	this.rli.on('SIGINT', this.handleSigint.bind(this));
	this.rli.on('line', this.handleLine.bind(this));
	this.rli.prompt();
};

REPLExample.prototype.handleSigint = function () {
	process.stdout.write("\n");
	this.rli.close();
	process.exit();
};

REPLExample.prototype.handleLine = function (cmd) {
	try {
		var result = this.box.eval(cmd);
	} catch (e) {
		process.stdout.write(e.stack ? e.stack.toString() : e.toString());
	}
	process.stdout.write(util.inspect(result, false, 2, true)+"\n");
	this.rli.prompt();
};

new REPLExample();
