// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";

import { commandLineMainEntry } from "./run";
import { getOpenFileFromCliChannel, getOpenUrlFromMacEventChannel } from "../event";

// Logger
const debug = debug_("readium-desktop:main:lock");

export function lockInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (gotTheLock) {

        // https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
        app.on("will-finish-launching", () => {

            // https://api.archivelab.org/books/letters_to_friend_2004_librivox/opds_audio_manifest
            // tslint:disable-next-line: max-line-length
            // https://streamer.kvmai.com/pub/aHR0cHM6Ly9uZ25peC1zZXJ2ZXItbmNuZGFkd3M0cS1leS5hLnJ1bi5hcHAvcHVibGljL0FjY2Vzc2libGVfRVBVQl8zLmVwdWI=/manifest.json
            //
            // https://w3c.github.io/publ-tests/test_reports/manifest_processing/
            // =>
            // https://w3c.github.io/publ-tests/audiobooks/manifest_processing/tests/a4.2.04.html
            // https://w3c.github.io/publ-tests/audiobooks/manifest_processing/tests/a4.2.02.html

            // To test in dev mode:
            // setTimeout(() => {
            //     const url = "xxx";
            //     const openUrlChannel = getOpenUrlFromMacEventChannel();
            //     openUrlChannel.put(url);
            //     debug("====================== open url", url);
            // }, 10000);

            app.on("open-url", (event, url) => {
                event.preventDefault();

                debug("#####");
                debug("OPEN URL", url);
                debug("#####");

                url = url.split("thorium:")[1];
                if (url) {

                    debug("open url", url);
                    const openUrlChannel = getOpenUrlFromMacEventChannel();
                    openUrlChannel.put(url);
                }
            });

            app.on("open-file", async (event, filePath) => {
                event.preventDefault();

                debug("#####");
                debug("OPEN FILE", filePath);
                debug("#####");

                // if (!await openFileFromCli(filePath)) {
                    // debug(`the open-file event with ${filePath} return an error`);
                // }

                if (filePath) {
                    const openFileFromCliChannel = getOpenFileFromCliChannel();
                    openFileFromCliChannel.put(filePath);
                }
            });
        });

        // https://github.com/electron/electron/blob/master/docs/api/app.md#event-second-instance
        app.on("second-instance", (_e, argv, _workingDir) => {

            debug("#####");
            debug("Someone tried to run a second instance, we should focus our window", argv);
            debug("#####");

            // Someone tried to run a second instance, we should focus our window.
            debug("comandLine", argv, _workingDir);

            const libraryAppWindow = getLibraryWindowFromDi();
            if (libraryAppWindow) {
                if (libraryAppWindow.isMinimized()) {
                    libraryAppWindow.restore();
                }
                libraryAppWindow.show(); // focuses as well
            }

            commandLineMainEntry(argv.filter((arg) => !arg.startsWith("--")));
        });
    }
    return gotTheLock;
}
