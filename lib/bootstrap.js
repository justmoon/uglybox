function objWhitelist(obj, keys) {
	for (var i = 0; i < keys.length; i++) {
		var prop = keys[i];
		obj.prototype["$"+prop+"$"] = (function (obj, prop) {
			function func() {
        var that = this, args = arguments;
				return obj.prototype[prop].apply(that, arguments);
			};
			func.valueOf = function () {
				return 'function '+prop+'() {\n [uglybox code] \n}';
			};
			return func;
		})(obj, prop);
	}
};

function objWhitelistStatic(obj, keys, source) {
	source = source || obj;
	for (var i = 0; i < keys.length; i++) {
		var prop = keys[i];
		obj["$"+prop+"$"] = source[prop];
	}
};

function objWhitelistConst(obj, keys, source) {
	source = source || obj;
	for (var i = 0; i < keys.length; i++) {
		var prop = keys[i];
		// TODO: Maybe use __defineGetter__ to make these read-only?
		//       (on supported platforms)
		obj["$"+prop+"$"] = source[prop];
	}
};

RegExp.prototype.$constructor$ = RegExp;
objWhitelist(RegExp,['compile','exec','test']);
objWhitelistStatic(RegExp,['lastMatch','lastParen','leftContext']);
RegExp.$constructor$ = $Function$;
$RegExp$ = RegExp;

function $Function$() {
	var UBOX_A = function () {
		return [].slice.call(arguments, 0);
	}
	var compiled = Function.apply(this, arguments);
	compiled = self.compile(compiled);

	return eval(compiled);
};


Boolean.$contructor$ = $Function$;
Boolean.prototype.$contructor$ = Boolean;
$Boolean$ = Boolean;

Function.prototype.$constructor$ = $Function$;
objWhitelist(Function, ['call','apply']);

objWhitelist(String, ["charAt","charCodeAt","concat","indexOf","lastIndexOf","localeCompare","match","replace","search","slice","split","substr","substring","toLocaleLowerCase","toLocaleString","toLocaleUpperCase","toLowerCase","toUpperCase"]);
objWhitelistStatic(String, ["fromCharCode"]);
String.prototype.$constructor$ = String;
String.$constructor$ = $Function$;
$String$ = String;

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

Object.$constructor$ = $Function$;
Object.prototype.$constructor$ = Object;
Object.prototype.$hasOwnProperty$ = function (prop) {
	return this.hasOwnProperty("$"+prop+"$");
};
objWhitelist(Object, ["valueOf","toString"]);
$Object$ = Object;

$Error$ = Error;

objWhitelistStatic(console, ["log","warn","error"]);
$console$ = console;

$Function$.$constructor$ = $Function$;
