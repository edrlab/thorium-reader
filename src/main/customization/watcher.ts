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

export function customizationStartFileWatcherFromWellKnownFolder(wellKnownFolder: string, callback: (path: string) => void): FSWatcher {

    wellKnownFolder = path.join(wellKnownFolder, "/");

    debug("START FILE WATCHING FROM ", wellKnownFolder);

    const watcher = chokidar.watch(wellKnownFolder, {
        persistent: true, // default true

        usePolling: false, // default false
        alwaysStat: false, // default false


        // keep .thor files
        ignored: (file, stats) => stats?.isFile() && !file.endsWith(".thor"),

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
        .on("add", (path) => {
            debug(`FSWatch: File ${path} has been added`);
            debug("START callback");
            callback(path);
        })
        .on("change", (path) => {
            debug(`FSWatch: File ${path} has been changed`);
            debug("START callback");
            callback(path);
        })
        .on("unlink", (path) => {
            debug(`FSWatch: File ${path} has been removed`);
            callback(path);
        });

    // More possible events.
    watcher
        .on("addDir", (path) => debug(`FSWatch: Directory ${path} has been added`))
        .on("unlinkDir", (path) => debug(`FSWatch: Directory ${path} has been removed`))
        .on("error", (error) => {
            debug(`FSWatch: Watcher error: ${error}`);

            // TODO pentotially send an event to do manually profile checking/provisioning
        })
        .on("ready", () => debug("FSWatch: Initial scan complete. Ready for changes in " + wellKnownFolder))
        .on("raw", (event, path, details) => {
            // internal
            debug("FSWatch: Raw event info:", event, path, details);
        });

    return watcher;
}
