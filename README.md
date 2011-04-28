# What is Uglybox?

Uglybox is a self-hosting JavaScript sandbox. It's inspired by
Gareth Hayes' [JSReg](https://code.google.com/p/jsreg/). The main
difference is that we use parse-js
from [UglifyJS](https://github.com/mishoo/UglifyJS/) to parse the
source instead of regular expressions.

# Status

This version of Uglybox is a very early prototype. It is broken and
completely insecure. The API is not yet final.

# Installation

Prerequisites are Node.js and git.

    git clone git://github.com/justmoon/uglybox.git --recursive

# Examples

Several examples on how to use the library are provided in the
`examples/` folder. To run an example simply call it with node:

    node examples/helloworld.js

# Usage

## Sandboxed eval()

If you just want to eval some code without it being able to access
your page, create a new Sandbox and call its eval() method:

    var sandbox = new Sandbox();
    sandbox.eval('2+2');

## Precompile Code

Because Uglybox supports both Node.js as well as browsers, you can
precompile code on the server using Node.js and then run it in the
browser. Note that obviously you have to trust your server.

On the server:

    var sandbox = new Sandbox();
    var compiledCode = sandbox.compile(myCode);

On the client:

    var sandbox = new Sandbox();
    sandbox.includeCompiled('http://example.com/myPrecompiledCode.js');

## Custom sandbox extensions

Most of the time, you'll want sandbox code to be able to call certain
defined APIs. To do this using Uglybox, you can get a copy of the
sandboxed environment and add objects to it:

    var sandbox = new Sandbox();
    sandbox.getEnv().$MyApi$ = {
        $myMethod$: function (param1, param2) {
            // ... do stuff
        }
    };

Note the $...$ - we have to use those because they are added to all
identifiers in sandboxed code, so when you're calling the above API
from inside the sandbox you'd leave them out, e.g.

    MyApi.myMethod("foo", "bar");

Obviously you have to be very careful when exposing APIs to sandboxed
code. Make sure you properly sanitize your inputs and don't expose any
functionality that would allow somebody to break out of the sandbox.

# License

Copyright (c) 2011 Stefan Thomas <justmoon@members.fsf.org>

Uglybox is dual-licensed under the
[GPLv3](http://www.gnu.org/licenses/gpl-3.0.html) and
[MIT](http://creativecommons.org/licenses/MIT/) licenses. Text
versions of both licenses are included in this release.

# Contributing

If you find bugs, exploits etc., please open an issue on
[Github](https://github.com/justmoon/uglybox).


