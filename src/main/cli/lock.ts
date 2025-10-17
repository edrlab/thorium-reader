// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";

import { commandLineMainEntry } from ".";
import { getOpenFileFromCliChannel } from "../event";
import { isOpenUrl, setOpenUrl } from "./url";
import { URL_HOST_OPDS_AUTH, URL_PROTOCOL_APP_HANDLER_OPDS, URL_PROTOCOL_APP_HANDLER_THORIUM } from "readium-desktop/common/streamerProtocol";

// Logger
const filename = "readium-desktop:main:lock";
const debug = debug_(filename);

export function lockInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (gotTheLock) {

        // https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
        app.on("will-finish-launching", () => {

            // https://api.archivelab.org/books/letters_to_friend_2004_librivox/opds_audio_manifest
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

                if (isOpenUrl(url)) {
                    setOpenUrl(url);
                } else {
                    debug("Not an open url the scheme doesn't match and/or is not a valid url");
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

            // On Windows, protocol URLs are passed as the last argument
            // Look for opds:// or thorium:// URLs in the argv
            let protocolUrl: string | undefined;
            for (let i = argv.length - 1; i >= 0; i--) {
                const arg = argv[i];
                if (arg && (arg.startsWith(`${URL_PROTOCOL_APP_HANDLER_OPDS}://`) ||
                           arg.startsWith(`${URL_PROTOCOL_APP_HANDLER_THORIUM}://`) ||
                           arg.startsWith("http://") ||
                           arg.startsWith("https://"))) {
                    protocolUrl = arg;
                    debug("Found protocol URL in argv:", protocolUrl);
                    break;
                }
            }

            // Someone tried to run a second instance, we should focus our window.
            debug("comandLine", argv, _workingDir);

            // https://github.com/edrlab/thorium-reader/pull/1573#issuecomment-1003042325
            try {
                const libraryAppWindow = getLibraryWindowFromDi();
                if (libraryAppWindow && !libraryAppWindow.isDestroyed() && !libraryAppWindow.webContents.isDestroyed()) {
                    if (libraryAppWindow.isMinimized()) {
                        libraryAppWindow.restore();
                    }
                    libraryAppWindow.show(); // focuses as well
                }
            } catch (_e) {
                // ignore
            }

            // If we found a protocol URL, check if it's an auth callback or a feed URL
            if (protocolUrl && isOpenUrl(protocolUrl)) {
                // Check if this is an OPDS auth callback (opds://authorize/...)
                // Auth callbacks must be handled by commandLineMainEntry, not setOpenUrl
                let isAuthCallback = false;
                try {
                    const urlObj = new URL(protocolUrl);
                    if (urlObj.protocol === `${URL_PROTOCOL_APP_HANDLER_OPDS}:` &&
                        urlObj.hostname === URL_HOST_OPDS_AUTH) {
                        isAuthCallback = true;
                        debug("Detected OPDS auth callback URL, routing to commandLineMainEntry");
                    }
                } catch (e) {
                    debug("Failed to parse protocol URL:", e);
                }

                if (isAuthCallback) {
                    // Auth callback - let commandLineMainEntry handle it
                    commandLineMainEntry(argv.filter((arg) => !arg.startsWith("--")));
                } else {
                    // Regular feed URL or file - use setOpenUrl
                    debug("Processing feed/file URL from second instance:", protocolUrl);
                    setOpenUrl(protocolUrl);
                }
            } else {
                // Otherwise, process as normal command line
                commandLineMainEntry(argv.filter((arg) => !arg.startsWith("--")));
            }
        });
    }
    return gotTheLock;
}
