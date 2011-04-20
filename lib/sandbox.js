if (require) {
	var sys = require('sys');
	var jsp = require("../vendor/UglifyJS/lib/parse-js"),
	    slice = jsp.slice,
	    member = jsp.member,
	    PRECEDENCE = jsp.PRECEDENCE,
	    OPERATORS = jsp.OPERATORS;
	var winston = require('winston');
} else {
	// TODO: Add env setup for browser
}


var Sandbox = exports.Sandbox = function Sandbox() {
};

Sandbox.prototype.eval = function (code) {
	// We can't compile functions - note that the 
	if ("function" !== typeof code) {
		code = this.compile(code);
	}
	this.evalCompiled(compiledCode);
};

Sandbox.prototype.evalCompiled = function (code) {
	if (!this.env) this.createEnv();

	var fn;
	if ("function" === typeof code) {
		fn = fn;
	} else {
		fn = (new Function( "with(this) { " + code + "}"));
	}
	var result = fn.call(this.env);

	return result;
};

Sandbox.prototype.includeCompiled = function (file) {
	if (!this.env) this.createEnv();

	if (require) {
		for (p in this.env) {
			global[p] = this.env[p];
		}
		this.env.require = require;
		this.evalCompiled("require('"+file+"');");
	} else {
		// TODO: Browser support
	}
};

Sandbox.prototype.compile = function (code) {
	var ast = jsp.parse(code);
//	console.log(sys.inspect(ast, false, null));

	var compiledCode = this.genCode(ast, {beautify: true});
	console.log(compiledCode);

	return compiledCode;
};

var ALLOWED_PROPERTIES = jsp.array_to_hash([
	"length",
	"global",
	"ignoreCase",
	"input",
	"multiline",
	"source",
	"lastIndex",
	"prototype"
]);

var ALLOWED_NAMES = jsp.array_to_hash([
	"this",
	"prototype",
	"true",
	"false",
	"null"
]);

Sandbox.prototype.createEnv = function () {
	var self = this;

	if (global) { // Node.js
		this.env = global;
	} else if (window) { // Browser
		// TODO: Create sandbox iframe
		this.env = window;
	} else {
		throw new Error("Unknown/unsupported type of JavaScript environment");
	}

	function objWhitelist(obj, keys) {
		for (var i = 0; i < keys.length; i++) {
			var prop = keys[i];
			obj.prototype["$"+prop+"$"] = (function (obj, prop) {
				function func() {
					return this[prop].apply(this, arguments);
				}
				func.valueOf = function () {
					return 'function '+prop+'() {\n [uglybox code] \n}';
				}
				return func;
			})(obj, prop);
		}
	};

	function objWhitelistStatic(obj, keys) {
		for (var i = 0; i < keys.length; i++) {
			var prop = keys[i];
			obj["$"+prop+"$"] = obj[prop];
		}
	};

	function objWhitelistConst(obj, keys) {
		for (var i = 0; i < keys.length; i++) {
			var prop = keys[i];
			// TODO: Maybe use __defineGetter__ to make these read-only?
			//       (on supported platforms)
			obj["$"+prop+"$"] = obj[prop];
		}
	};

	with (this.env) {
		// Precompile an eval() function that applies the masking
		eval = function (code) {
			with (this) {
				var result = eval(code);
			}
			return result;
		};

		$window$ = self.env;

		// array/object [] accessor
		sub = function (key) {
			if ("undefined" == typeof key) {
				return null;
			} else if (/[^\d]/.test(key) || key === '') {
				if (HOP(ALLOWED_PROPERTIES, key)) {
					return key;
				}

				return "$"+key+"$";
			} else {
				return +key;
			}
		};

		// array constant
		arr = function () {
			return Array.prototype.slice.call(arguments, 0);
		};

		function $Function$() {
			var UBOX_A = function () {
				return [].slice.call(arguments, 0);
			}
			var compiled = Function.apply(this, arguments);
			compiled = self.compile(compiled);

			return eval(compiled);
		};
		$Function$.$constructor$ = $Function$;

		Boolean.$contructor$ = $Function$;
		Boolean.prototype.$contructor$ = Boolean;

		Function.prototype.$constructor$ = $Function$;
		objWhitelist(Function, ['call','apply']);

		objWhitelist(String, ["charAt","charCodeAt","concat","indexOf","lastIndexOf","localeCompare","match","replace","search","slice","split","substr","substring","toLocaleLowerCase","toLocaleString","toLocaleUpperCase","toLowerCase","toUpperCase"]);
		objWhitelistStatic(String, ["fromCharCode"]);
		String.prototype.$constructor$ = String;
		String.$constructor$ = $Function$;
		$String$ = String;

		RegExp.prototype.$constructor$ = RegExp;
		objWhitelist(RegExp,['compile','exec','test']);
		objWhitelistStatic(RegExp,['lastMatch','lastParen','leftContext']);
		RegExp.$constructor$ = $Function$;
		$RegExp$ = RegExp;

		objWhitelist(Array, ["sort","join","pop","push","reverse","shift","slice","splice","unshift","concat"]);
		Array.prototype.$constructor$ = Array;
		Array.$constructor$ = $Function$;
		$Array$ = Array;

		objWhitelist(Number, ["toExponential","toFixed","toPrecision"]);
		objWhitelistConst(Number, ["MAX_VALUE","MIN_VALUE","NaN","NEGATIVE_INFINITY","POSITIVE_INFINITY"]);
		Number.$constructor$ = $Function$;
		$Number$ = Number;

		objWhitelist(Date, ["getDate","getDay","getFullYear","getHours","getMilliseconds","getMinutes","getMonth","getSeconds","getTime","getTimezoneOffset","getUTCDate","getUTCDay","getUTCFullYear","getUTCHours","getUTCMilliseconds","getUTCMinutes","getUTCMonth","getUTCSeconds","getYear","setDate","setFullYear","setHours","setMilliseconds","setMinutes","setMonth","setSeconds","setTime","setUTCDate","setUTCFullYear","setUTCHours","setUTCMilliseconds","setUTCMinutes","setUTCMonth","setUTCSeconds","setYear","toDateString","toGMTString","toLocaleDateString","toLocaleString","toLocaleTimeString","toTimeString","toUTCString"]);
		Date.prototype.$constructor$ = Date;
		Date.$constructor$ = $Function$;
		$Date$ = Date;

		objWhitelistStatic(Math, ["abs","acos","asin","atan","atan2","ceil","cos","exp","floor","log","max","min","pow","random","round","sin","sqrt","tan"]);
		objWhitelistConst(Math, ["E","LN10","LN2","LOG10E","LOG2E","PI","SQRT1_2","SQRT2"]);
		Math.$constructor$ = Object;
		$Math$ = Math;

		objWhitelistConst(this.env, ["decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","isFinite","isNaN","parseFloat","parseInt","unescape"]);

		var intervalIds = [];
		var timeoutIds = [];
		function $clearInterval$(id) {
			id = +id;
			if ("undefined" == typeof intervalIds[id]) {
				return null;
			}
			return clearInterval(id);
		};
		function $clearTimeout$(id) {
			id = +id;
			if ("undefined" == typeof timeoutIds[id]) {
				return null;
			}
			return clearTimeout(id);
		};
		function $clearInterval$(func, time) {
			time = +time;
			if (time <= 0) time = null;

			if ("function" !== typeof func) {
				func = $Function$(func);
			}
			var id = +setInterval(func, time);
			intervalIds[id] = true;
			return id;
		};
		function $setInterval$(func, time) {
			time = +time;
			if (time <= 0) time = null;

			if ("function" !== typeof func) {
				func = $Function$(func);
			}
			var id = +setTimeout(func, time);
			timeoutIds[id] = true;
			return id;
		};

		function $alert$(msg) {
			alert(msg);
		};

		function $eval$(code) {
			self.eval(code);
		};

		Object.$constructor$ = $Function$;
		Object.prototype.$constructor$ = Object;
		Object.prototype.$hasOwnProperty$ = function (prop) {
			return this.hasOwnProperty("$"+prop+"$");
		};
		objWhitelist(Object, ["valueOf","toString"]);
		$Object$ = Object;

		objWhitelistStatic(console, ["log","error"]);
		$console$ = console;
	}
};

var DOT_CALL_NO_PARENS = jsp.array_to_hash([
	"name",
	"array",
	"object",
	"string",
	"dot",
	"sub",
	"call",
	"regexp"
]);

function make_string(str, ascii_only) {
    var dq = 0, sq = 0;
    str = str.replace(/[\\\b\f\n\r\t\x22\x27\u2028\u2029]/g, function(s){
        switch (s) {
        case "\\": return "\\\\";
        case "\b": return "\\b";
        case "\f": return "\\f";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\t": return "\\t";
        case "\u2028": return "\\u2028";
        case "\u2029": return "\\u2029";
        case '"': ++dq; return '"';
        case "'": ++sq; return "'";
        }
        return s;
    });
    if (ascii_only) str = to_ascii(str);
    if (dq > sq) return "'" + str.replace(/\x27/g, "\\'") + "'";
    else return '"' + str.replace(/\x22/g, '\\"') + '"';
};

function to_ascii(str) {
	return str.replace(/[\u0080-\uffff]/g, function(ch) {
		var code = ch.charCodeAt(0).toString(16);
		while (code.length < 4) code = "0" + code;
		return "\\u" + code;
	});
};

Sandbox.prototype.genCode = function (ast, options) {
	options = defaults(options, {
		indent_start : 0,
		indent_level : 4,
		quote_keys : false,
		space_colon : false,
		beautify : false,
		ascii_only : true
	});
	var beautify = !!options.beautify;
	var indentation = 0,
	newline = beautify ? "\n" : "",
	space = beautify ? " " : "";

	function encode_string(str) {
		return make_string(str, options.ascii_only);
	};

	function make_name(name) {
		name = name.toString();
		if (options.ascii_only)
			name = to_ascii(name);

		if (HOP(ALLOWED_NAMES, name)) return name;

		return "$"+name+"$";
	};

	function indent(line) {
		if (line == null)
			line = "";
		if (beautify)
			line = repeat_string(" ", options.indent_start + indentation * options.indent_level) + line;
		return line;
	};

	function with_indent(cont, incr) {
		if (incr == null) incr = 1;
		indentation += incr;
		try { return cont.apply(null, slice(arguments, 1)); }
		finally { indentation -= incr; }
	};

	function add_spaces(a) {
		if (beautify)
			return a.join(" ");
		var b = [];
		for (var i = 0; i < a.length; ++i) {
			var next = a[i + 1];
			b.push(a[i]);
			if (next &&
				((/[a-z0-9_\x24]$/i.test(a[i].toString()) && /^[a-z0-9_\x24]/i.test(next.toString())) ||
				 (/[\+\-]$/.test(a[i].toString()) && /^[\+\-]/.test(next.toString())))) {
				b.push(" ");
			}
		}
		return b.join("");
	};

	function add_commas(a) {
		return a.join("," + space);
	};

	function parenthesize(expr) {
		var gen = make(expr);
		for (var i = 1; i < arguments.length; ++i) {
			var el = arguments[i];
			if ((el instanceof Function && el(expr)) || expr[0] == el)
				return "(" + gen + ")";
		}
		return gen;
	};

	function best_of(a) {
		if (a.length == 1) {
			return a[0];
		}
		if (a.length == 2) {
			var b = a[1];
			a = a[0];
			return a.length <= b.length ? a : b;
		}
		return best_of([ a[0], best_of(a.slice(1)) ]);
	};

	function needs_parens(expr) {
		if (expr[0] == "function" || expr[0] == "object") {
			// dot/call on a literal function requires the
			// function literal itself to be parenthesized
			// only if it's the first "thing" in a
			// statement. This means that the parent is
			// "stat", but it could also be a "seq" and
			// we're the first in this "seq" and the
			// parent is "stat", and so on. Messy stuff,
			// but it worths the trouble.
			var a = slice($stack), self = a.pop(), p = a.pop();
			while (p) {
				if (p[0] == "stat") return true;
				if (((p[0] == "seq" || p[0] == "call" || p[0] == "dot" || p[0] == "sub" || p[0] == "conditional") && p[1] === self) ||
					((p[0] == "binary" || p[0] == "assign" || p[0] == "unary-postfix") && p[2] === self)) {
					self = p;
					p = a.pop();
				} else {
					return false;
				}
			}
		}
		return !HOP(DOT_CALL_NO_PARENS, expr[0]);
	};

	function make_num(num) {
		var str = num.toString(10), a = [ str.replace(/^0\./, ".") ], m;
		if (Math.floor(num) === num) {
			a.push("0x" + num.toString(16).toLowerCase(), // probably pointless
				   "0" + num.toString(8)); // same.
			if ((m = /^(.*?)(0+)$/.exec(num))) {
				a.push(m[1] + "e" + m[2].length);
			}
		} else if ((m = /^0?\.(0+)(.*)$/.exec(num))) {
			a.push(m[2] + "e-" + (m[1].length + m[2].length),
				   str.substr(str.indexOf(".")));
		}
		return best_of(a);
	};

	var generators = {
		"string": encode_string,
		"num": make_num,
		"name": make_name,
		"toplevel": function(statements) {
			return make_block_statements(statements)
				.join(newline + newline);
		},
		"block": make_block,
		"var": function(defs) {
			return "var " + add_commas(MAP(defs, make_1vardef)) + ";";
		},
		"const": function(defs) {
			return "const " + add_commas(MAP(defs, make_1vardef)) + ";";
		},
		"try": function(tr, ca, fi) {
			var out = [ "try", make_block(tr) ];
			if (ca) out.push("catch", "(" + ca[0] + ")", make_block(ca[1]));
			if (fi) out.push("finally", make_block(fi));
			return add_spaces(out);
		},
		"throw": function(expr) {
			return add_spaces([ "throw", make(expr) ]) + ";";
		},
		"new": function(ctor, args) {
			args = args.length > 0 ? "(" + add_commas(MAP(args, make)) + ")" : "";
			return add_spaces([ "new", parenthesize(ctor, "seq", "binary", "conditional", "assign", function(expr){
				var w = ast_walker(), has_call = {};
				try {
					w.with_walkers({
						"call": function() { throw has_call },
						"function": function() { return this }
					}, function(){
						w.walk(expr);
					});
				} catch(ex) {
					if (ex === has_call)
						return true;
					throw ex;
				}
			}) + args ]);
		},
		"switch": function(expr, body) {
			return add_spaces([ "switch", "(" + make(expr) + ")", make_switch_block(body) ]);
		},
		"break": function(label) {
			var out = "break";
			if (label != null)
				out += " " + make_name(label);
			return out + ";";
		},
		"continue": function(label) {
			var out = "continue";
			if (label != null)
				out += " " + make_name(label);
			return out + ";";
		},
		"conditional": function(co, th, el) {
			return add_spaces([ parenthesize(co, "assign", "seq", "conditional"), "?",
								parenthesize(th, "seq"), ":",
								parenthesize(el, "seq") ]);
		},
		"assign": function(op, lvalue, rvalue) {
			if (op && op !== true) op += "=";
			else op = "=";
			return add_spaces([ make(lvalue), op, parenthesize(rvalue, "seq") ]);
		},
		"dot": function(expr) {
			var out = make(expr), i = 1;
			if (expr[0] == "num") {
				if (!/\./.test(expr[1]))
					out += ".";
			} else if (needs_parens(expr))
				out = "(" + out + ")";
			while (i < arguments.length)
				out += "." + make_name(arguments[i++]);
			return out;
		},
		"call": function(func, args) {
			var f = make(func);
			if (needs_parens(func))
				f = "(" + f + ")";
			return f + "(" + add_commas(MAP(args, function(expr){
				return parenthesize(expr, "seq");
			})) + ")";
		},
		"function": make_function,
		"defun": make_function,
		"if": function(co, th, el) {
			var out = [ "if", "(" + make(co) + ")", el ? make_then(th) : make(th) ];
			if (el) {
				out.push("else", make(el));
			}
			return add_spaces(out);
		},
		"for": function(init, cond, step, block) {
			var out = [ "for" ];
			init = (init != null ? make(init) : "").replace(/;*\s*$/, ";" + space);
			cond = (cond != null ? make(cond) : "").replace(/;*\s*$/, ";" + space);
			step = (step != null ? make(step) : "").replace(/;*\s*$/, "");
			var args = init + cond + step;
			if (args == "; ; ") args = ";;";
			out.push("(" + args + ")", make(block));
			return add_spaces(out);
		},
		"for-in": function(vvar, key, hash, block) {
			console.log(block);
			block = make_forin_block(key, block);
			console.log(block);
			return add_spaces([ "for", "(" +
								(vvar ? make(vvar).replace(/;+$/, "") : make(key)),
								"in",
								make(hash) + ")", make(block) ]);
		},
		"while": function(condition, block) {
			return add_spaces([ "while", "(" + make(condition) + ")", make(block) ]);
		},
		"do": function(condition, block) {
			return add_spaces([ "do", make(block), "while", "(" + make(condition) + ")" ]) + ";";
		},
		"return": function(expr) {
			var out = [ "return" ];
			if (expr != null) out.push(make(expr));
			return add_spaces(out) + ";";
		},
		"binary": function(operator, lvalue, rvalue) {
			var left = make(lvalue), right = make(rvalue);
			// XXX: I'm pretty sure other cases will bite here.
			// we need to be smarter.
			// adding parens all the time is the safest bet.
			if (member(lvalue[0], [ "assign", "conditional", "seq" ]) ||
				lvalue[0] == "binary" && PRECEDENCE[operator] > PRECEDENCE[lvalue[1]]) {
				left = "(" + left + ")";
			}
			if (member(rvalue[0], [ "assign", "conditional", "seq" ]) ||
				rvalue[0] == "binary" && PRECEDENCE[operator] >= PRECEDENCE[rvalue[1]] &&
				!(rvalue[1] == operator && member(operator, [ "&&", "||", "*" ]))) {
				right = "(" + right + ")";
			}
			return add_spaces([ left, operator, right ]);
		},
		"unary-prefix": function(operator, expr) {
			var val = make(expr);
			if (!(expr[0] == "num" || (expr[0] == "unary-prefix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
				val = "(" + val + ")";
			return operator + (jsp.is_alphanumeric_char(operator.charAt(0)) ? " " : "") + val;
		},
		"unary-postfix": function(operator, expr) {
			var val = make(expr);
			if (!(expr[0] == "num" || (expr[0] == "unary-postfix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
				val = "(" + val + ")";
			return val + operator;
		},
		"sub": function(expr, subscript) {
			var hash = make(expr);
			if (needs_parens(expr))
				hash = "(" + hash + ")";
			return hash + "[sub(" + make(subscript) + ")]";
		},
		"object": function(props) {
			if (props.length == 0)
				return "{}";
			return "{" + newline + with_indent(function(){
				return MAP(props, function(p){
					if (p.length == 3) {
						// getter/setter. The name is in p[0], the arg.list in p[1][2], the
						// body in p[1][3] and type ("get" / "set") in p[2].
						return indent(make_function(p[0], p[1][2], p[1][3], p[2]));
					}
					var key = p[0], val = make(p[1]);
					if (options.quote_keys) {
						key = encode_string("$"+key+"$");
					} else if ((typeof key == "number" || !beautify && +key + "" == key)
							   && parseFloat(key) >= 0) {
						key = make_num(+key);
					} else if (!is_identifier(key)) {
						key = encode_string("$"+key+"$");
					} else {
						key = "$"+key+"$";
					}
					return indent(add_spaces(beautify && options.space_colon
											 ? [ key, ":", val ]
											 : [ key + ":", val ]));
				}).join("," + newline);
			}) + newline + indent("}");
		},
		"regexp": function(rx, mods) {
			return "/" + rx + "/" + mods;
		},
		"array": function(elements) {
			if (elements.length == 0) return "[]";
			return add_spaces([ "[", add_commas(MAP(elements, function(el){
				if (!beautify && el[0] == "atom" && el[1] == "undefined") return "";
				return parenthesize(el, "seq");
			})), "]" ]);
		},
		"stat": function(stmt) {
			return make(stmt).replace(/;*\s*$/, ";");
		},
		"seq": function() {
			return add_commas(MAP(slice(arguments), make));
		},
		"label": function(name, block) {
			return add_spaces([ make_name(name), ":", make(block) ]);
		},
		"with": function(expr, block) {
			return add_spaces([ "with", "(" + make(expr) + ")", make(block) ]);
		},
		"atom": function(name) {
			return make_name(name);
		}
	};

	// The squeezer replaces "block"-s that contain only a single
	// statement with the statement itself; technically, the AST
	// is correct, but this can create problems when we output an
	// IF having an ELSE clause where the THEN clause ends in an
	// IF *without* an ELSE block (then the outer ELSE would refer
	// to the inner IF). This function checks for this case and
	// adds the block brackets if needed.
	function make_then(th) {
		if (th[0] == "do") {
			// https://github.com/mishoo/UglifyJS/issues/#issue/57
			// IE croaks with "syntax error" on code like this:
			// if (foo) do ... while(cond); else ...
			// we need block brackets around do/while
			return make([ "block", [ th ]]);
		}
		var b = th;
		while (true) {
			var type = b[0];
			if (type == "if") {
				if (!b[3])
					// no else, we must add the block
					return make([ "block", [ th ]]);
				b = b[3];
			}
			else if (type == "while" || type == "do") b = b[2];
			else if (type == "for" || type == "for-in") b = b[4];
			else break;
		}
		return make(th);
	};

	var function_preamble = [
		"var $arguments$=[].slice.call(arguments,0);",
		"$arguments$.$callee$=arguments.callee;"
	];

	function make_function(name, args, body, keyword) {
		var out = keyword || "function";
		if (name) {
			out += " " + make_name(name);
		}
		out += "(" + add_commas(MAP(args, make_name)) + ")";

		return add_spaces([ out, make_block(body, function_preamble) ]);
	};

	function make_block_statements(statements) {
		for (var a = [], last = statements.length - 1, i = 0; i <= last; ++i) {
			var stat = statements[i];
			var code = make(stat);
			if (code != ";") {
				if (!beautify && i == last) {
					if ((stat[0] == "while" && empty(stat[2])) ||
						(member(stat[0], [ "for", "for-in"] ) && empty(stat[4])) ||
						(stat[0] == "if" && empty(stat[2]) && !stat[3]) ||
						(stat[0] == "if" && stat[3] && empty(stat[3]))) {
						code = code.replace(/;*\s*$/, ";");
					} else {
						code = code.replace(/;+\s*$/, "");
					}
				}
				a.push(code);
			}
		}
		return MAP(a, indent);
	};

	function make_switch_block(body) {
		var n = body.length;
		if (n == 0) return "{}";
		return "{" + newline + MAP(body, function(branch, i){
			var has_body = branch[1].length > 0, code = with_indent(function(){
				return indent(branch[0]
							  ? add_spaces([ "case", make(branch[0]) + ":" ])
							  : "default:");
			}, 0.5) + (has_body ? newline + with_indent(function(){
				return make_block_statements(branch[1]).join(newline);
			}) : "");
			if (!beautify && has_body && i < n - 1)
				code += ";";
			return code;
		}).join(newline) + newline + indent("}");
	};

	function make_block(statements, preamble) {
		if (!statements) return ";";
		if (statements.length == 0) return "{}";
		preamble = preamble || [];
		return "{" + newline + with_indent(function(){
			return MAP(preamble, indent).concat(
				make_block_statements(statements)).join(newline);
		}) + newline + indent("}");
	};

	function make_1vardef(def) {
		var name = def[0], val = def[1];
		if (val != null)
			name = add_spaces([ make_name(name), "=", parenthesize(val, "seq") ]);
		else
			name = make_name(name);

		return name;
	};

	function make_forin_block(key, statements) {
		// for (var i in bla) { if(!/^[$].+[$]$/.test($i$)){continue;};
		// $i$=$i$.replace(/^\$|\$$/g,''); }
		var preamble =
			[ [ 'if',
				[ 'unary-prefix',
				  '!',
				  [ 'call',
					[ 'dot', [ 'regexp', '^[$].+[$]$', '' ], 'test' ],
					[ key ] ] ],
				[ 'block', [ [ 'continue', null ] ] ],
				undefined ],
			  [ 'block' ],
			  [ 'stat',
				[ 'assign',
				  true,
				  key,
				  [ 'call',
					[ 'dot', key, 'replace' ],
					[ [ 'regexp', '^[$]|[$]$', 'g' ], [ 'string', '' ] ] ] ] ] ];
		statements[1] = preamble.concat(statements[1]);
		return statements;
	};

	var $stack = [];

	function make(node) {
		var type = node[0];
		var gen = generators[type];
		if (!gen)
			throw new Error("Can't find generator for \"" + type + "\"");
		$stack.push(node);
		var ret = gen.apply(type, node.slice(1));
		$stack.pop();
		return ret;
	};

	return make(ast);
};

function ast_walker(ast) {
        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(def){
                        var a = [ def[0] ];
                        if (def.length > 1)
                                a[1] = walk(def[1]);
                        return a;
                }) ];
        };
        var walkers = {
                "string": function(str) {
                        return [ this[0], str ];
                },
                "num": function(num) {
                        return [ this[0], num ];
                },
                "name": function(name) {
                        return [ this[0], name ];
                },
                "toplevel": function(statements) {
                        return [ this[0], MAP(statements, walk) ];
                },
                "block": function(statements) {
                        var out = [ this[0] ];
                        if (statements != null)
                                out.push(MAP(statements, walk));
                        return out;
                },
                "var": _vardefs,
                "const": _vardefs,
                "try": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                c != null ? [ c[0], MAP(c[1], walk) ] : null,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "throw": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "new": function(ctor, args) {
                        return [ this[0], walk(ctor), MAP(args, walk) ];
                },
                "switch": function(expr, body) {
                        return [ this[0], walk(expr), MAP(body, function(branch){
                                return [ branch[0] ? walk(branch[0]) : null,
                                         MAP(branch[1], walk) ];
                        }) ];
                },
                "break": function(label) {
                        return [ this[0], label ];
                },
                "continue": function(label) {
                        return [ this[0], label ];
                },
                "conditional": function(cond, t, e) {
                        return [ this[0], walk(cond), walk(t), walk(e) ];
                },
                "assign": function(op, lvalue, rvalue) {
                        return [ this[0], op, walk(lvalue), walk(rvalue) ];
                },
                "dot": function(expr) {
                        return [ this[0], walk(expr) ].concat(slice(arguments, 1));
                },
                "call": function(expr, args) {
                        return [ this[0], walk(expr), MAP(args, walk) ];
                },
                "function": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "defun": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "if": function(conditional, t, e) {
                        return [ this[0], walk(conditional), walk(t), walk(e) ];
                },
                "for": function(init, cond, step, block) {
                        return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];
                },
                "for-in": function(vvar, key, hash, block) {
                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
                },
                "while": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "do": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "return": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "binary": function(op, left, right) {
                        return [ this[0], op, walk(left), walk(right) ];
                },
                "unary-prefix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "unary-postfix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "sub": function(expr, subscript) {
                        return [ this[0], walk(expr), walk(subscript) ];
                },
                "object": function(props) {
                        return [ this[0], MAP(props, function(p){
                                return p.length == 2
                                        ? [ p[0], walk(p[1]) ]
                                        : [ p[0], walk(p[1]), p[2] ]; // get/set-ter
                        }) ];
                },
                "regexp": function(rx, mods) {
                        return [ this[0], rx, mods ];
                },
                "array": function(elements) {
                        return [ this[0], MAP(elements, walk) ];
                },
                "stat": function(stat) {
                        return [ this[0], walk(stat) ];
                },
                "seq": function() {
                        return [ this[0] ].concat(MAP(slice(arguments), walk));
                },
                "label": function(name, block) {
                        return [ this[0], name, walk(block) ];
                },
                "with": function(expr, block) {
                        return [ this[0], walk(expr), walk(block) ];
                },
                "atom": function(name) {
                        return [ this[0], name ];
                }
        };

        var user = {};
        var stack = [];
        function walk(ast) {
                if (ast == null)
                        return null;
                try {
                        stack.push(ast);
                        var type = ast[0];
                        var gen = user[type];
                        if (gen) {
                                var ret = gen.apply(ast, ast.slice(1));
                                if (ret != null)
                                        return ret;
                        }
                        gen = walkers[type];
                        return gen.apply(ast, ast.slice(1));
                } finally {
                        stack.pop();
                }
        };

        function with_walkers(walkers, cont){
                var save = {}, i;
                for (i in walkers) if (HOP(walkers, i)) {
                        save[i] = user[i];
                        user[i] = walkers[i];
                }
                var ret = cont();
                for (i in save) if (HOP(save, i)) {
                        if (!save[i]) delete user[i];
                        else user[i] = save[i];
                }
                return ret;
        };

        return {
                walk: walk,
                with_walkers: with_walkers,
                parent: function() {
                        return stack[stack.length - 2]; // last one is current node
                },
                stack: function() {
                        return stack;
                }
        };
};

function empty(b) {
        return !b || (b[0] == "block" && (!b[1] || b[1].length == 0));
};

function repeat_string(str, i) {
        if (i <= 0) return "";
        if (i == 1) return str;
        var d = repeat_string(str, i >> 1);
        d += d;
        if (i & 1) d += str;
        return d;
};

function defaults(args, defs) {
	var ret = {};
	if (args === true)
		args = {};
	for (var i in defs) if (HOP(defs, i)) {
		ret[i] = (args && HOP(args, i)) ? args[i] : defs[i];
	}
	return ret;
};

function is_identifier(name) {
    return /^[a-z_$][a-z0-9_$]*$/i.test(name)
        && name != "this"
        && !HOP(jsp.KEYWORDS_ATOM, name)
        && !HOP(jsp.RESERVED_WORDS, name)
        && !HOP(jsp.KEYWORDS, name);
};

function HOP(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop);
};

var MAP;

(function(){
	MAP = function(a, f, o) {
		var ret = [];
		for (var i = 0; i < a.length; ++i) {
			var val = f.call(o, a[i], i);
			if (val instanceof AtTop) ret.unshift(val.v);
			else ret.push(val);
		}
		return ret;
	};
	MAP.at_top = function(val) { return new AtTop(val) };
	function AtTop(val) { this.v = val };
})();
