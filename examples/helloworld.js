var Sandbox = require('../lib/sandbox').Sandbox;

try {
	var mySandbox = new Sandbox();

	mySandbox.eval("console.log('Hello World!')");
} catch (e) {
	if (e.stack) console.log(e.stack);
 	else console.log(e.toString());
}
