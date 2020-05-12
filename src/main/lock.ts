// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";

import { openFileFromCli } from "./cli/commandLine";
import { cli } from "./cli/process";

// Logger
const debug = debug_("readium-desktop:main:lock");

export function lockInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (gotTheLock) {

        // https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
        app.on("will-finish-launching", () => {
            app.on("open-url", (event, _url) => {
                event.preventDefault();
                // Process url: import or open?
            });
            app.on("open-file", async (event, filePath) => {
                event.preventDefault();

                if (!await openFileFromCli(filePath)) {
                    debug(`the open-file event with ${filePath} return an error`);
                }
            });
        });

        // https://github.com/electron/electron/blob/master/docs/api/app.md#event-second-instance
        app.on("second-instance", (_e, argv, _workingDir) => {
            // Someone tried to run a second instance, we should focus our window.
            debug("comandLine", argv, _workingDir);

            const libraryAppWindow = getLibraryWindowFromDi();
            if (libraryAppWindow) {
                if (libraryAppWindow.isMinimized()) {
                    libraryAppWindow.restore();
                }
                libraryAppWindow.show(); // focuses as well
            }

            // execute command line from second instance
            // when the command line doesn't used electron: execute and exit in second instance process
            // when the command has needed to open win electron: execute with below cli function
            // the mainFct is disallow to avoid to generate new mainWindow
            // remove --version and --help because isn't handle in ready state app
            // tslint:disable-next-line: no-empty
            cli(() => {}, argv.filter((arg) => !arg.startsWith("--")));
        });
    }
    return gotTheLock;
}
