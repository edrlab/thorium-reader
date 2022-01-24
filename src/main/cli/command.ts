// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as glob from "glob";
import * as debug_ from "debug";
import { app } from "electron";
import { EOL } from "os";
import { diMainGet } from "readium-desktop/main/di";
import * as yargs from "yargs";
import { createStoreFromDi } from "../di";
import { SagaMiddleware } from "@redux-saga/core";
import { PublicationView } from "readium-desktop/common/views/publication";
import { start } from "readium-desktop/main/start";
import { getOpenFileFromCliChannel, getOpenTitleFromCliChannel, getOpenUrlWithOpdsSchemeEventChannel } from "readium-desktop/main/event";
import * as path from "path";
import validator from "validator";

// Logger
const debug = debug_("readium-desktop:cli:command");

// https://github.com/edrlab/thorium-reader/pull/1573#issuecomment-1003075223
let __cliMainCommandLockBoolean = false;

export const opdsCommand = async (argv: yargs.Arguments<{
    title: string;
} & {
    url: string;
}>) => {

    let returnCode = 0;
    try {

        // save an opds feed with title and url in the db
        const { title, url } = argv;
        const hostname = (new URL(url)).hostname;
        if (hostname) {

            const sagaMiddleware = diMainGet("saga-middleware");
            const opdsApi = diMainGet("opds-api");

            const feed = await sagaMiddleware.run(opdsApi.addFeed, { title, url }).toPromise<PublicationView[]>();
            if (!feed && feed?.length === 0) {
                process.stdout.write("OPDS import done." + EOL);
                return;
            }

        }
        process.stderr.write("OPDS URL not valid, exit with code 1" + EOL);

    } catch (e) {

        debug("opds import error :", e);
        process.stderr.write("OPDS import ERROR: " + e.toString() + EOL);

        returnCode = 1;

    } finally {

        app.exit(returnCode);
    }

};

export const importCommand = async (argv: yargs.Arguments<{
    title: string;
} & {
    url: string;
} & {
    path: string;
}>) => {


    const pathArray = glob.sync(argv.path, {
        absolute: true,
        realpath: true,
    }) || [];
    const pathArrayResolved = pathArray.length ? pathArray : argv.path;

    debug(pathArray, argv.path, pathArrayResolved);

    let returnCode = 0;
    try {

        debug("cliImport", pathArrayResolved);
        const filePath = pathArrayResolved;

        // cliImport need the SagaMiddleware
        await createStoreFromDi();

        // import a publication from local path
        const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

        const sagaMiddleware: SagaMiddleware = diMainGet("saga-middleware");
        const pubApi = diMainGet("publication-api");
        for (const fp of filePathArray) {

            debug("cliImport filePath in filePathArray: ", fp);
            const pubViews = await sagaMiddleware.run(pubApi.importFromFs, fp).toPromise<PublicationView[]>();

            if (!pubViews && pubViews?.length === 0) {
                process.stdout.write("Publication(s) import done." + EOL);
                return;
            }
        }
        process.stderr.write("No valid files, exit with code 1" + EOL);

    } catch (e) {

        debug("import error :", e);
        process.stderr.write("import ERROR: " + e.toString() + EOL);

        returnCode = 1;

    } finally {

        app.exit(returnCode);
    }
};

export const readCommand = async (argv: yargs.Arguments<{
    title: string;
}>) => {

    // flush session because user ask to read one publication
    try {

        await Promise.all([
            start(true),
            app.whenReady(),
        ]);

        if (argv.title) {
            const openTitleFromCliChannel = getOpenTitleFromCliChannel();
            openTitleFromCliChannel.put(argv.title);
        }

    } catch (e) {

        debug("read title error :", e);

        // const errorTitle = "No publication to read";
        // dialog.showErrorBox(errorTitle, e.toString());

        process.stderr.write("read title ERROR: " + e.toString() + EOL);
    }

};

export const mainCommand = async (argv: yargs.Arguments<{
    "path": string[] | string | undefined;
}>) => {

    try {
        debug("thorium $0");
        debug("loading main");

        // flush session because user ask to read one publication
        const { path: pathArgv } = argv;
        const openPublicationRequestedBool = Array.isArray(pathArgv) ? pathArgv.length > 0 : !!pathArgv;

        const startPromise = (() => {

            if (__cliMainCommandLockBoolean) {
                return Promise.resolve();
            }
            __cliMainCommandLockBoolean = true;
            return start(openPublicationRequestedBool);
        })();

        await Promise.all([
            // https://github.com/edrlab/thorium-reader/pull/1573#issuecomment-1003075223
            startPromise,
            app.whenReady(),
        ]);

        debug("main started");

        if (openPublicationRequestedBool) {

            // pathArgv can be an url with deepLinkInvocation in windows
            // https://github.com/oikonomopo/electron-deep-linking-mac-win
            //
            // handle opds://
            // to add the feed and open it
            const url = pathArgv[0];

            // /hello/world -> failed
            // C:\hello\world -> works -> protocol=file: but must failed
            // https://hello/world -> work
            const urlIsValid = validator.isURL(url, {
                protocols: ['http', 'https', 'opds', 'thorium'],
            });
            if (urlIsValid) {

                const openUrlChan = getOpenUrlWithOpdsSchemeEventChannel();
                openUrlChan.put(url);
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

    } catch (e) {

        debug("$0 path error :", e);

        // const errorTitle = "Import Failed";
        // dialog.showErrorBox(errorTitle, e.toString());

        process.stderr.write("$0 title ERROR: " + e.toString() + EOL);
    }
};
