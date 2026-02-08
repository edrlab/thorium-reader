// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/visionmedia/debug/blob/master/src/index.js
// typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs
// (defaults to "debug/src/browser" when Electron renderer process)
import * as debugBrowser from "debug";
// https://github.com/visionmedia/debug/blob/master/src/node.js
import * as debugNode from "debug/src/node"; // used for shell output (print to stderr/out stream)
import * as util from "util";

// https://github.com/visionmedia/debug/blob/master/src/common.js
// import * as debugCommon from "debug/src/common";

// https://github.com/visionmedia/debug/blob/master/src/browser.js
// import * as debugBrowser from "debug/src/browser";

// BLACKBOXING:
// console-redirect.js
// debug/src/browser.js
// debug/src/common.js
// https://developer.chrome.com/devtools/docs/blackboxing

export function consoleRedirect(
    debugNamespace: string,
    stdout: NodeJS.WriteStream,
    stderr: NodeJS.WriteStream,
    printInOriginalConsole: boolean): () => void {

    const _consoleFunctionNames = ["error", "info", "log", "warn"];
    if (console.debug && (typeof console.debug === "function")) {
        _consoleFunctionNames.push("debug");
    }

    const outStream = stderr || stdout;
    const debugNodeInstance: debug.IDebugger = debugNode(debugNamespace + "_");

    // debug() default is:
    // process.stderr.write(util.format(...args) + '\n');
    // https://github.com/visionmedia/debug/blob/master/src/node.js#L190
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function debugLog(this: any, ...args: any[]): void {
        // const prefix = (this === debugNodeInstance) ? "i" :
        //     ((this === debugNode) ? "g" :
        //     ((this === debugBrowser) ? "b" : "?"));

        outStream.write(// prefix +
            // eslint-disable-next-line prefer-spread
            util.format.apply(util, args) + "\n");

        // process.stderr.write(util.inspect(this,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }) + "\n");
        // handleLog(args);
    }

    // https://github.com/visionmedia/debug/blob/master/src/common.js#L113
    // const logFn = self.log || createDebug.log;
    // (debugNode as any).log = debugLog.bind(debugNode); // global
    debugNodeInstance.log = debugLog.bind(debugNodeInstance); // takes precedence

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function processConsoleFunctionCall(this: Console, ...args: any[]): void {

        // process.stderr.write("PROCESSING... " + util.inspect(args,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }) + "\n");

        // Attempt to reverse-parse the web console format in the raw message,
        // so it can be dumped into the shell console via the debug instance:
        let processed = false;
        if (args.length >= 4) {
            if (typeof args[0] === "string" &&
                args[0].startsWith("%c") &&
                args[0].length >= 3) {
                const c2i = args[0].indexOf(" %c");
                if (c2i >= 3) {
                    const ns = args[0].substr(2, c2i - 2);
                    const lci = args[0].lastIndexOf("%c +");
                    if (lci > c2i) {
                        const d = c2i + 3;
                        const l = lci - d; // args[0].length - d - (args[0].length - lci)
                        const msg = args[0].substr(d, l);
                        const count = (msg.replace(/%%/g, "").match(/%[Oosdjc]/g) || []).length;
                        const newAr = [ msg ];
                        if (count > 0) {
                            for (let j = 0; j < count; j++) {
                                newAr.push(args[j + 3]);
                            }
                        }
                        const k = count + 3 + 1;
                        if (k < args.length) {
                            for (let j = k; j < args.length; j++) {
                                newAr.push(args[j]);
                            }
                        }

                        // process.stderr.write("PARSED: " + util.inspect(newAr,
                        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }) + "\n");

                        // Temporary debug namespace switch, so that the existing debug instance
                        // can be used to dump the raw message into the shell console:
                        const nsp = debugNodeInstance.namespace;
                        debugNodeInstance.namespace = ns;
                        debugNodeInstance.apply(debugNodeInstance, newAr);
                        debugNodeInstance.namespace = nsp;
                        processed = true;
                    }
                }
            }
        }
        // Message cannot be reverse-parsed from web console format
        // => dump it "as is" into the shell console:
        if (!processed) {
            // process.stderr.write("FALLBACK: " + util.inspect(args,
            //     { showHidden: false, depth: 1000, colors: true, customInspect: true }) + "\n");

            debugNodeInstance.apply(debugNodeInstance, args);
            // outStream.write(util.format.apply(util, args) + "\n");
        }
    }
    // processConsoleFunctionCall.bind(console);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debugBrowser as any).log = (...args: any[]): void => {
        processConsoleFunctionCall.apply(console, args);

        if (printInOriginalConsole) {
            const consoleFunctionName = "log";
            const originalConsoleFunction =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((originalConsole as any)[consoleFunctionName] as ((...args: any[]) => void));
            // process.stderr.write(consoleFunctionName + " -- " + util.inspect(originalConsoleFunction,
            //     { showHidden: false, depth: 1000, colors: true, customInspect: true }) + "\n");
            originalConsoleFunction.apply(console, args);
        }
    };

    const originalConsole = {};

    _consoleFunctionNames.forEach((consoleFunctionName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const consoleFunction = (console as any)[consoleFunctionName] as ((...args: any[]) => void);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (originalConsole as any)[consoleFunctionName] = consoleFunction.bind(console);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function newConsoleFunction(this: Console, ...args: any[]): void {

            // [].slice.call(arguments) or Array.prototype.slice.call(arguments) or Array.from(arguments)

            // const writeStream = (consoleFunctionName === "error" || consoleFunctionName === "warn")
            //     ? stderr
            //     : stdout;

            // if (writeStream) {
            //     writeStream.write("\n################# DEBUG:\n" + args.join("\n---\n") + "\n#################\n");
            // }

            processConsoleFunctionCall.apply(this, args);

            if (printInOriginalConsole) {
                const originalConsoleFunction =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ((originalConsole as any)[consoleFunctionName] as ((...args: any[]) => void));
                // process.stderr.write(consoleFunctionName + " -- " + util.inspect(originalConsoleFunction,
                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }) + "\n");
                originalConsoleFunction.apply(this, args);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (console as any)[consoleFunctionName] = newConsoleFunction.bind(console);
    });

    return () => {
        _consoleFunctionNames.forEach((consoleFunctionName) => {
            const originalConsoleFunction =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((originalConsole as any)[consoleFunctionName] as ((...args: any[]) => void));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (console as any)[consoleFunctionName] = originalConsoleFunction.bind(console);
        });
    };
}

// debug("xxx");
// console.log("xxx");
// debug("xx%%x");
// console.log("xx%%x");
// debug("xxx%%");
// console.log("xxx%%");
// debug("%%xxx");
// console.log("%%xxx");
// debug("xxx", 2, "yy%%y");
// console.log("xxx", 2, "yy%%y");
// debug("%%xxx %d %s", 2, "y%%yy");
// console.log("%%xxx %d %s", 2, "y%%yy");
// debug("xxx %d %s%%", 2, "yyy", 3, true);
// console.log("xxx %d %s%%", 2, "yyy", 3, true);
// debug("xxx %d %s %% da%3Dniel%3D", 2, "yyy", 3, false);
// console.log("xxx %d %s %% da%3Dniel%3D", 2, "yyy", 3, false);
// debug("xxx %d %s %c daniel", 2, "yyy", "color: red", 3, true);
// console.log("xxx %d %s %c daniel", 2, "yyy", "color: red", 3, true);
