// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import { promises as fsp } from "fs";
import * as path from "path";
import { call as callTyped } from "typed-redux-saga/macro";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";

export function* exportPublication(publicationView: PublicationView) {

    const libraryAppWindow = yield* callTyped(() => getLibraryWindowFromDi());

    // Open a dialog to select a folder then copy the publication in it
    const res = yield* callTyped(() => dialog.showOpenDialog(
        libraryAppWindow ? libraryAppWindow : undefined,
        {
            properties: ["openDirectory"],
        },
    ));

    if (!res.canceled) {
        if (res.filePaths && res.filePaths.length > 0) {
            let destinationPath = res.filePaths[0];
            // If the selected path is a file then choose the directory containing this file
            const stat = yield* callTyped(() => fsp.stat(destinationPath));
            if (stat?.isFile()) {
                destinationPath = path.dirname(destinationPath);
            }
            const publicationStorage = diMainGet("publication-storage");
            publicationStorage.copyPublicationToPath(publicationView, destinationPath);
        }
    }
}
