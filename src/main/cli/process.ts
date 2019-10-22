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
import { lockInstance } from "readium-desktop/main/lock";
import { _APP_NAME, _APP_VERSION, _PACKAGING } from "readium-desktop/preprocessor-directives";
import * as yargs from "yargs";

import { cliImport, cliOpds, openFileFromCli, openTitleFromCli } from "./commandLine";

// Logger
const debug = debug_("readium-desktop:cli");

// single Instance Lock
const gotTheLock = lockInstance();
// When gotTheLock is true :
//  the app is typically launched with the GUI,
//
// when gotTheLock is false :
//  the app normally exits immediately, but in our case,
//  the pure-CLI (no GUI) code is executed to report CLI message into process.stdout/stderr,
//  and then exits.
//  The second-instance event is still received, but the argv is ignored for the CLI,
//  as it has already been executed by the "second instance" itself (see Yargs handlers).

// main Fucntion variable
let mainFct: () => void = () => ({});

// yargs configuration
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
            // if the app is not started or it's the second instance
            // The boolean app.isReady is true when the second-instance event handler is called
            // (as guaranteed by the Electron API
            // https://github.com/electron/electron/blob/master/docs/api/app.md#event-second-instance )
            if (!app.isReady() || !gotTheLock) {
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
            }
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
            // if the app is not started or it's the second instance
            // The boolean app.isReady is true when the second-instance event handler is called
            // (as guaranteed by the Electron API
            // https://github.com/electron/electron/blob/master/docs/api/app.md#event-second-instance
            if (!app.isReady() || !gotTheLock) {
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
            }
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
            // if it's the main instance
            if (gotTheLock) {
                mainFct();
                app.whenReady().then(async () => {
                    try {
                        if (!await openTitleFromCli(argv.title)) {
                            const errorMessage = `There is no publication title match for \"${argv.title}\"`;
                            throw new Error(errorMessage);
                        }
                    } catch (e) {
                        debug("read error :", e);
                        const errorTitle = "No publication to read";
                        dialog.showErrorBox(errorTitle, e.toString());
                        process.stderr.write(e.toString() + EOL);
                    }
                }).catch(() => {
                    // ignore
                });
            } else {
                app.exit(0);
            }
        },
    )
    .command("$0 [path]",
        "import and read an epub or lcpl file",
        (y) =>
            y.positional("path", {
                describe: "path of your publication, it can be an absolute, relative path",
                type: "string",
                coerce: (arg) => path.resolve(arg),
            })
                .completion()
        ,
        (argv) => {
            // if it's the main instance
            if (gotTheLock) {
                mainFct();
                if (argv.path) {
                    app.whenReady().then(async () => {
                        try {
                            if (!await openFileFromCli(argv.path)) {
                                const errorMessage = `Import failed for the publication path : ${argv.path}`;
                                throw new Error(errorMessage);
                            }
                        } catch (e) {
                            debug("$0 error :", e);
                            const errorTitle = "Import Failed";
                            dialog.showErrorBox(errorTitle, e.toString());
                            process.stderr.write(e.toString() + EOL);
                        }
                    }).catch(() => {
                        // ignore
                    });
                }
            } else {
                app.exit(0);
            }
        },
    )
    .help()
    .fail((msg, err) => {
        if (!app.isReady() || !gotTheLock) {
            process.stdout.write(`${msg || ""}${msg ? "" : "\n"}${err || ""}\n`);
            app.exit(1);
        }
    });

/**
 * main entry of thorium
 * @param main main function to exec
 * @param processArgv process.argv
 */
export function cli(main: () => void, processArgv = process.argv) {
    mainFct = main;
    const argFormated = processArgv
        .filter((arg) => knownOption(arg) || !arg.startsWith("-"))
        .slice((_PACKAGING === "0") ? 2 : 1);
    debug("processArgv", processArgv, "arg", argFormated);
    yargs.parse(argFormated);
}

// arrow function to filter declared option in yargs
const knownOption = (str: string) => [
    "--help",
    "--version",
].includes(str);
