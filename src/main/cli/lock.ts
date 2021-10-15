// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";

import { commandLineMainEntry } from ".";
import { getOpenFileFromCliChannel, getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeFromMacEventChannel } from "../event";

// Logger
const filename = "readium-desktop:main:lock";
const debug = debug_(filename);

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

                const checkUrl = (u: string): string | undefined => {

                    const testUrl = (a: string) => tryCatchSync(() => new URL(a), filename);
                    const urlWithHttps = "https://" + u;
                    const checkedUrl = testUrl(u) ? u : testUrl(urlWithHttps) ? urlWithHttps : undefined;

                    return checkedUrl;
                }

                if (url.startsWith("thorium:")) {
                    const importUrl = url.split("thorium:")[1];
                    const importUrlChecked = checkUrl(importUrl);

                    if (importUrlChecked) {
                        
                        debug("open url with thorium:// protocol scheme", importUrlChecked);
                        debug("This url will be imported in thorium with importFromLink entry point");
                        const openUrlChannel = getOpenUrlWithThoriumSchemeFromMacEventChannel();
                        openUrlChannel.put(importUrlChecked);
                    }
                }

                if (url.startsWith("opds:")) {
                    const importUrl = url.split("opds:")[1];
                    const importUrlChecked = checkUrl(importUrl);

                    if (importUrlChecked) {
                        
                        debug("open url with opds:// protocol scheme", importUrlChecked);
                        debug("This url will be imported in thorium with opds/addFeed entry point");
                        const openUrlChannel = getOpenUrlWithOpdsSchemeEventChannel();
                        openUrlChannel.put(importUrlChecked);
                    }
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
