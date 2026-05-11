// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
// import os from "node:os";

import { commandLineMainEntry } from ".";
import { getOpenFileFromCliChannel } from "../event";
import { isOpenUrl, setOpenUrl } from "./url";
import { _APP_NAME, _APP_VERSION, _PACK_NAME } from "readium-desktop/preprocessor-directives";
import { FORCE_PROD_DB_IN_DEV, USER_DATA_FOLDER } from "readium-desktop/common/constant";
import { appendFileSyncWithRotation } from "readium-desktop/utils/log";

// Logger
const filename = "readium-desktop:main:lock";
const debug = debug_(filename);

const folderPath = path.join(
    USER_DATA_FOLDER,
    !FORCE_PROD_DB_IN_DEV && (__TH__IS_DEV__ || __TH__IS_CI__) ? "app-logs-dev" : "app-logs",
);
const PROCESS_LOGS = "processLogs.txt";
const appLogs = path.join(
    folderPath,
    PROCESS_LOGS,
);

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

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
        app.on("second-instance", (_e, argv, workingDir, additionalData) => {

            debug("#####");
            debug("Someone tried to run a second instance, we should focus our window", argv);
            debug("#####");

            let dump = "#############################################\n";
            dump += "SECOND-INSTANCE:\n"; 
            dump += `Date: ${(new Date()).toISOString()}\n`;
            // dump += 

            dump += `Process: ${JSON.stringify({
                node_version: process.version,
                pid: process.pid,
                platform: process.platform,
                arch: process.arch,
                uptime_seconds: process.uptime(),
                memory_usage: process.memoryUsage(),
                argv: process.argv,
                MSWindowsStore: process.windowsStore,
                thoriumAppName: _APP_NAME,
                thoriumAppVersion: _APP_VERSION,
                thoriumPackName: _PACK_NAME,
                thoriumUserDataPath: USER_DATA_FOLDER,
            }, null, 4)}\n`;

            // Someone tried to run a second instance, we should focus our window.
            let secMsg = "second-instance arguments:\n";
            secMsg += `argv: ${JSON.stringify(argv, null, 4)}\n`;
            secMsg += `workingDirectory: ${JSON.stringify(workingDir, null, 4)}\n`;
            secMsg += `additionalData: ${JSON.stringify(additionalData, null, 4)}\n`;
            debug(secMsg);
            dump += secMsg;

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

            const argvFormated = argv.filter((arg) => !arg.startsWith("--"));

            const msg = "Start Command Line with: " + JSON.stringify(argvFormated, null, 4) + "\n";
            debug(msg);
            dump += msg;

            commandLineMainEntry(argvFormated);

            dump += "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$44\n";
            appendFileSyncWithRotation(appLogs, dump);
        });
    }
    return gotTheLock;
}
