// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import * as path from "path";
import { _PACKAGING } from "readium-desktop/preprocessor-directives";
import * as yargs from "yargs";
import { cli_, cliImport, cliOpds, cliRead } from "./commandLine";

declare const __APP_NAME__: string;

// Logger
const debug = debug_("readium-desktop:cli");

export function cli(mainFct: () => void) {

    yargs
        .scriptName(__APP_NAME__)
        .usage("$0 <option> [args]")
        .command("opds <title> <url>",
            "import opds feed",
            (y) =>
                y.positional("title", {
                    describe: "title opds feed",
                    type: "string",
                })
                .positional("url", {
                    describe: "url opds feed",
                    type: "string",
                })
            ,
            (argv) => {
                const promise = cliOpds(argv.title, argv.url);
                promise.then((isValid) => {
                    if (isValid) {
                        app.exit(0);
                        return ;
                    }
                    app.exit(1);
                }).catch(() => {
                    app.exit(1);
                });
            },
        )
        .command("import <path>",
            "import epub or lpcl file",
            (y) =>
                y.positional("path", {
                    describe: "path of your publication",
                    type: "string",
                    coerce: (arg) => path.resolve(arg),
                })
            ,
            (argv) => {
                const promise = cliImport(argv.path);
                promise.then((isValid) => {
                    console.log(isValid);
                    if (isValid) {
                        app.exit(0);
                        return ;
                    }
                    app.exit(1);
                }).catch(() => {
                    app.exit(1);
                });
            },
        )
        .command("read <title>",
            "searches already-imported publications with the provided TITLE, and opens the reader with the first match",
            (y) =>
                y.positional("title", {
                    describe: "title of your publication",
                    type: "string",
                })
            ,
            (argv) => {
                mainFct();
                app.on("will-finish-launching", async () => {
                    await cliRead(argv.title);
                });
            },
        )
        .command("$0 [path]",
            "default command",
            (y) =>
                y.positional("path", {
                    describe: "publication in absolute or relative path",
                    type: "string",
                    coerce: (arg) => path.resolve(arg),
                })
            ,
            (argv) => {
                // const filePathArray = argv._.map((p) => path.resolve(p));

                mainFct();
                if (argv.path) {
                    app.on("will-finish-launching", async () => {
                        if (!await cli_(argv.path)) {
                            debug("no publication to open");
                        }
                    });
                }
            },
        )
        .help()
        .parse((_PACKAGING === "0") ? process.argv.slice(2) : process.argv.slice(1));
}
