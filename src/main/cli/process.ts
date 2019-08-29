// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, dialog } from "electron";
import * as glob from "glob";
import { EOL } from "os";
import * as path from "path";
import { _APP_NAME, _APP_VERSION, _PACKAGING } from "readium-desktop/preprocessor-directives";
import * as yargs from "yargs";

import { cli_, cliImport, cliOpds, cliRead } from "./commandLine";

// Logger
const debug = debug_("readium-desktop:cli");

export function cli(mainFct: () => void) {

    yargs
        .scriptName(_APP_NAME)
        .version(_APP_VERSION)
        .usage("$0 <cmd> [args]")
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
                        process.stdout.write("OPDS import done." + EOL);
                        app.exit(0);
                        return;
                    }
                    process.stderr.write("OPDS URL not valid, exit with code 1" + EOL);
                    app.exit(1);
                }).catch((e) => {
                    debug("import error :", e);
                    process.stderr.write(e.toString() + EOL);
                    app.exit(1);
                });
            },
        )
        .command("import <path>",
            "import epub or lpcl file",
            (y) =>
                y.positional("path", {
                    describe: "absolute, relative or globbing path",
                    type: "string",
                })
                .example("import", "\"./myPath/**/*.epub\"")
                .example("import", "\"/*.epub\"")
                .example("import", "\"myPublication.epub\"")
            ,
            (argv) => {
                const pathArray = glob.sync(argv.path, {
                    absolute: true,
                    realpath: true,
                }) || [];
                const promise = cliImport(pathArray);
                promise.then((isValid) => {
                    if (isValid) {
                        process.stdout.write("Publication(s) import done." + EOL);
                        app.exit(0);
                        return;
                    }
                    process.stderr.write("No valid files, exit with code 1" + EOL);
                    app.exit(1);
                }).catch((e) => {
                    debug("import error :", e);
                    process.stderr.write(e.toString() + EOL);
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
                app.on("ready", async () => {
                    try {
                        if (!await cliRead(argv.title)) {
                            const errorMessage = `There is no publication title match for \"${argv.title}\"`;
                            throw new Error(errorMessage);
                        }
                    } catch (e) {
                        debug("read error :", e);
                        const errorTitle = "No publication to read";
                        dialog.showErrorBox(errorTitle, e.toString());
                        process.stderr.write(e.toString() + EOL);
                    }
                });
            },
        )
        .command("$0 [path]",
            "default command",
            (y) =>
                y.positional("path", {
                    describe: "path of your publication, it can be an absolute, relative path",
                    type: "string",
                    coerce: (arg) => path.resolve(arg),
                })
                    .completion()
            ,
            (argv) => {
                mainFct();
                if (argv.path) {
                    app.on("ready", async () => {
                        try {
                            if (!await cli_(argv.path)) {
                                const errorMessage = `Import failed for the publication path : ${argv.path}`;
                                throw new Error(errorMessage);
                            }
                        } catch (e) {
                            debug("$0 error :", e);
                            const errorTitle = "Import Failed";
                            dialog.showErrorBox(errorTitle, e.toString());
                            process.stderr.write(e.toString() + EOL);
                        }
                    });
                }
            },
        )
        .help()
        .parse(process.argv
            .filter((arg) => knownOption(arg) || !arg.startsWith("--"))
            .slice((_PACKAGING === "0") ? 2 : 1));
}

// arrow function to filter declared option in yargs
const knownOption = (str: string) => [
    "--help",
    "--version",
].includes(str);
