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
        .option("import", {
            type: "string",
            coerce: (arg) => path.resolve(arg),
            describe: "import epub or lpcl file",
        })
        .option("silent", {
            boolean: true,
            describe: "stay on command line and don't open main window",
        })
        .option("opds", {
            type: "string",
            coerce: (arg) => {
                const feed = (arg as string).split("=");
                const url = feed.length === 2 ? feed[1] : feed[0];
                const hostname = (new URL(url)).hostname;
                const title = feed.length === 2 ? feed[0] : hostname;
                if (!hostname) {
                    throw new Error("URL ERROR");
                }
                return { title, hostname };
            },
        })
        .coerce("file", (arg) => {
            return path.resolve(arg);
        })
        .command("opds <title=url>",
            "import epub or lpcl file",
            (y) =>
                y.positional("source", {
                    describe: "path of your publication",
                    type: "string",
                })
            ,
            (argv) => {
                if (cliOpds(argv.source)) {
                    app.exit(0);
                    return ;
                }
                app.exit(1);
            },
        )
        .command("import <path>",
            "import epub or lpcl file",
            (y) =>
                y.positional("source", {
                    describe: "path of your publication",
                    type: "string",
                    coerce: (arg) => path.resolve(arg),
                })
            ,
            (argv) => {
                if (cliImport(argv.source)) {
                    app.exit(0);
                    return ;
                }
                app.exit(1);
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
        .command("$0",
            "default command",
            (y) => y,
            (argv) => {
                const filePathArray = argv._.map((p) => path.resolve(p));

                mainFct();
                app.on("will-finish-launching", async () => {
                    if (!await cli_(filePathArray)) {
                        debug("error in publication path");
                    }
                });
            },
        )
        .help()
        .parse((_PACKAGING === "0") ? process.argv.slice(2) : process.argv.slice(1));
}
