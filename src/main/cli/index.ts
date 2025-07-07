// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, dialog } from "electron";
import * as path from "path";
import { lockInstance } from "readium-desktop/main/cli/lock";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import yargs from "yargs";
// import { hideBin } from "yargs/helpers";
import { closeProcessLock } from "../di";
import { EOL } from "os";
import { diMainGet } from "readium-desktop/main/di";
import { createStoreFromDi } from "../di";
import { needToPersistFinalState } from "../redux/sagas/persist";
import { appActions } from "../redux/actions";
import { getOpenFileFromCliChannel, getOpenTitleFromCliChannel } from "../event";
import { flushSession } from "../tools/flushSession";
import { isOpenUrl, setOpenUrl } from "./url";
import { globSync } from "glob";
import { PublicationView } from "readium-desktop/common/views/publication";
import { isAcceptedExtension } from "readium-desktop/common/extension";

// Logger
const debug = debug_("readium-desktop:cli:process");

// single Instance Lock
const gotTheLock = lockInstance();

if (gotTheLock) {
    debug("GOT THE LOCK ACQUIRED !!! (main process)");
} else {
    debug("DID NOT GOT THE LOCK !!!, so this a cli command and need to exit now");
    app.exit(0);
}
// When gotTheLock is true :
//  the app is typically launched with the GUI,
//
// when gotTheLock is false :
//  the app normally exits immediately, but in our case,
//  the pure-CLI (no GUI) code is executed to report CLI message into process.stdout/stderr,
//  and then exits.
//  The second-instance event is still received, but the argv is ignored for the CLI,
//  as it has already been executed by the "second instance" itself (see Yargs handlers).

let __appStarted = false;
let __returnCode = 0;
let __pendingCmd = 0;

// yargs configuration
const yargsInit = () =>
    yargs() // hideBin(process.argv)
        .scriptName(_APP_NAME)
        .version(_APP_VERSION)
        .usage("$0 <cmd> [args]")
        .command("opds <title> <url>",
            "import opds feed",
            (y) =>
                y.positional("title", {
                    describe: "title opds feed",
                    type: "string",
                }).positional("url", {
                    describe: "url opds feed",
                    type: "string",
                })
            ,
            async (argv) => {

                debug("CLI opds import", argv);

                await createStoreFromDi();
                const sagaMiddleware = diMainGet("saga-middleware");
                __pendingCmd++;

                try {
                    const { title, url } = argv;
                    const hostname = (new URL(url)).hostname;
                    if (hostname) {

                        const sagaMiddleware = diMainGet("saga-middleware");
                        const opdsApi = diMainGet("opds-api");

                        const feed = await sagaMiddleware.run(opdsApi.addFeed, { title, url }).toPromise();
                        process.stdout.write("OPDS import done : " + JSON.stringify(feed) + EOL);

                    } else {
                        process.stderr.write("OPDS URL not valid, exit with code 1" + EOL);
                        __returnCode = 1;
                    }

                } catch (e) {
                    debug("CLI OPDS ERROR", e);
                    __returnCode = 1;
                } finally {
                    __pendingCmd--;
                }

                if (!__appStarted && __pendingCmd <= 0 && !closeProcessLock.isLock) {

                    await sagaMiddleware.run(needToPersistFinalState).toPromise();
                    app.exit(__returnCode);
                    return ;
                }
            },
        )
        .command("import <path>",
            "import epub or lcpl file",
            (y) =>
                y.positional("path", {
                    describe: "absolute, relative or globbing path",
                    type: "string",
                    coerce: (arg) => path.resolve(arg),
                })
                    .example("import", "\"./myPath/**/*.epub\"")
                    .example("import", "\"/*.epub\"")
                    .example("import", "\"myPublication.epub\"")
            ,
            async (argv) => {

                debug("CLI import publication", argv);

                await createStoreFromDi();
                const sagaMiddleware = diMainGet("saga-middleware");
                __pendingCmd++;

                try {

                    const pathArray = globSync(argv.path, {
                        absolute: true,
                        realpath: true,
                    }) || [];
                    const filePathArrayResolved = pathArray.length ? pathArray : argv.path;

                    debug(pathArray, argv.path, filePathArrayResolved);
                    debug("cliImport", filePathArrayResolved);

                    // import a publication from local path
                    const filePathArray = Array.isArray(filePathArrayResolved) ? filePathArrayResolved : [filePathArrayResolved];

                    const pubApi = diMainGet("publication-api");
                    for (const fp of filePathArray) {

                        const ext = path.extname(fp);
                        const isPDF = isAcceptedExtension("pdf", ext);
                        if (isPDF) {
                            process.stderr.write("import PDF from CLI is not allowed: " + fp + EOL);
                            __returnCode = 1;
                            continue;
                        }

                        debug("cliImport filePath in filePathArray: ", fp);
                        const pubViews = await sagaMiddleware.run(pubApi.importFromFs, fp).toPromise<PublicationView[]>();
                        if (pubViews?.length) {
                            process.stdout.write("import success: " + fp + EOL);
                        } else {
                            process.stderr.write("import failed: " + fp + EOL);
                            __returnCode = 1;
                        }
                    }

                    process.stdout.write("import(s) done." + EOL);

                } catch (e) {
                    debug("CLI IMPORT ERROR", e);
                    __returnCode = 1;
                } finally {
                    __pendingCmd--;
                }

                if (!__appStarted && __pendingCmd <= 0 && !closeProcessLock.isLock) {

                    await sagaMiddleware.run(needToPersistFinalState).toPromise();
                    app.exit(__returnCode);
                    return ;
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
            async (argv) => {

                debug("CLI read", argv);
                __appStarted = true;
                await Promise.all([
                    createStoreFromDi().then((store) => store.dispatch(appActions.initRequest.build())),
                    app.whenReady(),
                ]);

                await flushSession();

                if (argv.title) {
                    const openTitleFromCliChannel = getOpenTitleFromCliChannel();
                    openTitleFromCliChannel.put(argv.title);
                }
            },
        )
        .command("$0 [path..]",
            "import and read an epub or lcpl file",
            (y) =>
                y.positional("path", {
                    describe: "path of your publication, it can be an absolute, relative path",
                    type: "string",
                    array: true,
                    // coerce: (arg) => path.resolve(arg),
                })
                    .completion()
            ,
            async (argv) => {

                __appStarted = true;
                await Promise.all([
                    createStoreFromDi().then((store) => store.dispatch(appActions.initRequest.build())),
                    app.whenReady(),
                ]);

                const { path: pathArgv } = argv;
                const openPublicationRequestedBool = Array.isArray(pathArgv) ? pathArgv.length > 0 : !!pathArgv;
                if (openPublicationRequestedBool) {

                    // flush session because user ask to read a publication
                    flushSession();

                    // pathArgv can be an url with deepLinkInvocation in windows
                    // https://github.com/oikonomopo/electron-deep-linking-mac-win
                    //
                    // handle opds:// thorium:// https:// http://
                    // to add the feed and open it
                    const url = pathArgv[0];
                    if (isOpenUrl(url)) {
                        debug("Need to import/open an URL : ", url);
                        setOpenUrl(url);
                        return;
                    }

                    // not an URL
                    const openFileFromCliChannel = getOpenFileFromCliChannel();
                    const pathArgvArray = Array.isArray(pathArgv) ? pathArgv : [pathArgv];
                    for (const pathArgvName of pathArgvArray) {

                        const pathArgvNameResolve = path.resolve(pathArgvName);
                        openFileFromCliChannel.put(pathArgvNameResolve);
                    }
                }
            },
        )
        .help()
        .fail((msg, err) => {
            if (!app.isReady()) {
                process.stdout.write(`${msg || ""}${msg ? "" : "\n"}${err || ""}\n`);
                app.exit(1);
                return ;
            }
        });

/**
 * main entry of thorium
 * @param main main function to exec
 * @param processArgv process.argv
 */
export function commandLineMainEntry(
    processArgv = process.argv,
) {

    debug("process.argv", process.argv);
    if (!__TH__IS_DEV__ && __TH__IS_PACKAGED__) {
        // https://nodejs.org/fr/docs/guides/debugging-getting-started/#enable-inspector
        // SIGUSR1

        // https://github.com/electron/fuses/issues/2
        for (const arg of process.argv) {
            debug("arg", arg);
            if (arg.includes("--debug") ||
                arg.includes("--remote") ||
                // https://www.electronjs.org/docs/api/command-line-switches#--remote-debugging-portport
                // arg.includes("--remote-debugging-port") ||
                // https://github.com/electron/electron/blob/73a017577e6d8cf67c76acb8f6a199c2b64ccb5d/shell/browser/electron_browser_main_parts.cc#L457
                // arg.includes("--remote-debugging-pipe") ||
                // arg.includes("--remote-allow-origins") ||
                // https://www.electronjs.org/docs/api/command-line-switches#--inspecthostport
                arg.includes("--inspect") ||
                // https://www.electronjs.org/docs/api/command-line-switches#--inspect-brkhostport
                // arg.includes("--inspect-brk") ||
                // https://github.com/nodejs/node/blob/fef180c8a20f680d246d5b109589e6a0370e7e77/src/node_options.cc#L314-L360
                // arg.includes("--inspect-brk-node") ||
                // https://www.electronjs.org/docs/api/command-line-switches#--inspect-porthostport
                // arg.includes("--inspect-port") ||
                // https://www.electronjs.org/docs/api/command-line-switches#--inspect-publish-uidstderrhttp
                // arg.includes("--inspect-publish-uid") ||
                // https://www.electronjs.org/docs/api/command-line-switches#--js-flagsflags
                arg.includes("--js-flags") ||
                arg.includes("--experimental-network-inspector")
            ) {
                // process.exit1);
                app.exit(1);
                return;
            }
        }
    }

    const y = yargsInit();

    const argFormated = processArgv
        .filter((arg) => knownOption(arg) || !arg.startsWith("-"))
        .slice(!__TH__IS_PACKAGED__ ? 2 : 1);

    debug("processArgv", processArgv, "arg", argFormated);

    try {
        y.parse(argFormated);
    } catch (e) {
        debug("YARGS ERROR !!!!!", e);
    }
}

// arrow function to filter declared option in yargs
const knownOption = (str: string) => [
    "--help",
    "--version",
].includes(str);


// Catch all unhandled rejection promise from CLI command
let __exitPhase = false;
process.on("unhandledRejection", (err) => {
    if (__exitPhase) {
        return ;
    }
    __exitPhase = true;
    const message = `${err}`;
    process.stderr.write(message);
    if (__appStarted) {
        dialog.showErrorBox("THORIUM ERROR", message);
    }
    app.exit(1);
});
