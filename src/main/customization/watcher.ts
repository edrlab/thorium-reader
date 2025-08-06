// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import path from "path";

// Logger
const debug = debug_("readium-desktop:main#utils/customization/watcher");

import chokidar, { FSWatcher } from "chokidar";

export function customizationStartFileWatcherFromWellKnownFolder(wellKnownFolder: string, callback: (fileName: string) => void): FSWatcher {

    wellKnownFolder = path.join(wellKnownFolder, "/");

    debug("START FILE WATCHING FROM ", wellKnownFolder);

    const watcher = chokidar.watch(wellKnownFolder, {
        persistent: true, // default true

        usePolling: false, // default false
        alwaysStat: false, // default false


        // keep .thor files
        ignored: (file, stats) => !(stats?.isFile() && file.endsWith(".thor")),

        awaitWriteFinish: true, // emit single event when chunked writes are completed
        atomic: true, // emit proper events when "atomic writes" (mv _tmp file) are used // default true

        // The options also allow specifying custom intervals in ms
        // awaitWriteFinish: {
        //   stabilityThreshold: 2000,
        //   pollInterval: 100
        // },
        // atomic: 100,

        //   interval: 100,
        //   binaryInterval: 300,

        // cwd: '.',
        depth: 0, // only current directory

        followSymlinks: true, // symlinks are authorized !?
        ignoreInitial: true, // doesn't emit when instanciate
        ignorePermissionErrors: true, // If watching fails due to EPERM or EACCES with this set to true, the errors will be suppressed silently.
    });


    watcher
        .on("add", (absoluteFilePath) => {
            debug(`FSWatch: File ${absoluteFilePath} has been added`);
            debug("START callback");

            if (path.extname(absoluteFilePath) !== ".thor") {
                debug("FSWatch: WATCHER ERROR!: Not in .thor !!?", absoluteFilePath);
                return;
            }
            const fileName = path.basename(absoluteFilePath);
            callback(fileName);
        })
        .on("change", (absoluteFilePath) => {
            debug(`FSWatch: File ${absoluteFilePath} has been changed`);
            debug("START callback");

            if (path.extname(absoluteFilePath) !== ".thor") {
                debug("FSWatch: WATCHER ERROR!: Not in .thor !!?", absoluteFilePath);
                return;
            }
            const fileName = path.basename(absoluteFilePath);
            callback(fileName);
        })
        .on("unlink", (absoluteFilePath) => {
            debug(`FSWatch: File ${absoluteFilePath} has been removed`);

            if (path.extname(absoluteFilePath) !== ".thor") {
                debug("FSWatch: WATCHER ERROR!: Not in .thor !!?", absoluteFilePath);
                return;
            }
            const fileName = path.basename(absoluteFilePath);
            callback(fileName);
        });

    // More possible events.
    watcher
        .on("addDir", (absoluteFilePath) => debug(`FSWatch: Directory ${absoluteFilePath} has been added`))
        .on("unlinkDir", (absoluteFilePath) => debug(`FSWatch: Directory ${absoluteFilePath} has been removed`))
        .on("error", (error) => {
            debug(`FSWatch: Watcher error: ${error}`);

            // TODO pentotially send an event to do manually profile checking/provisioning
        })
        .on("ready", () => debug("FSWatch: Initial scan complete. Ready for changes in " + wellKnownFolder))
        .on("raw", (event, absoluteFilePath, details) => {
            // internal
            debug("FSWatch: Raw event info:", event, absoluteFilePath, details);
        });

    return watcher;
}
