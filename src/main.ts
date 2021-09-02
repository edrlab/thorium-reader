// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, dialog } from "electron";
import * as path from "path";
import { cli } from "readium-desktop/main/cli/process";
import { createStoreFromDi, diMainGet } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { _PACKAGING, _VSCODE_LAUNCH } from "readium-desktop/preprocessor-directives";
import { Store } from "redux";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import { appActions } from "./main/redux/actions";
import { RootState } from "./main/redux/states";
import { initSessions as initSessionsNoHTTP } from "./main/streamerNoHttp";
import { tryCatch } from "./utils/tryCatch";

// import { initSessions as initSessionsHTTP } from "@r2-navigator-js/electron/main/sessions";

if (_PACKAGING !== "0") {
    // Disable debug in packaged app
    delete process.env.DEBUG;
    debug_.disable();

    /**
     * yargs used console and doesn't used process.stdout
     */
    /*
    console.log = (_message?: any, ..._optionalParams: any[]) => { return; };
    console.warn = (_message?: any, ..._optionalParams: any[]) => { return; };
    console.error = (_message?: IArrayWinRegistryReaderState,any, ..._optionalParams: any[]) => { return; };
    console.info = (_message?: any, ..._optionalParams: any[]) => { return; };
     */
}

// Logger
const debug = debug_("readium-desktop:main");

// Global
initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// Lcp
const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

// so that "tmp" can cleanup on process exit?
// SIGTERM?
// in Electron: before-quit App event
// process.on("SIGINT", () => {
//     console.log("SIGINT ... process.exit()");
//     process.exit();
// });

// protocol.registerSchemesAsPrivileged should be called before app is ready at initSessions
// if (_USE_HTTP_STREAMER) {
//     initSessionsHTTP();
// } else {
//     initSessionsNoHTTP();
// }
initSessionsNoHTTP();

export const main = async (flushSession = false): Promise<Store<RootState>> => {

    debug("main fct");

    let store = await tryCatch(() => diMainGet("store"), "Store not init");
    if (store) {
        return store;
    }

    store = await createStoreFromDi();
    debug("store loaded");

    try {

        if (flushSession) {

            const readers = store.getState().win.session.reader;
            for (const key in readers) {
                if (readers[key]) {

                    const reader = readers[key];
                    store.dispatch(winActions.session.unregisterReader.build(reader.identifier));
                    store.dispatch(winActions.registry.registerReaderPublication.build(
                        reader.publicationIdentifier,
                        reader.windowBound,
                        reader.reduxState,
                    ));
                }
            }
        }

        store.dispatch(appActions.initRequest.build());
        debug("STORE MOUNTED -> MOUNTING THE APP NOW");

    } catch (err) {
        const message = `REDUX STATE MANAGER CAN'T BE INITIALIZED, ERROR: ${JSON.stringify(err)} \n\nYou should remove your 'AppData' folder\nThorium Exit code 1`;
        process.stderr.write(message);

        dialog.showErrorBox("THORIUM ERROR", message);

        app.exit(1);
    }

    return store;
};

if (_VSCODE_LAUNCH === "true") {
    // tslint:disable-next-line: no-floating-promises
    main();
} else {
    cli(); // call main fct
}

debug("Process version:", process.versions);
