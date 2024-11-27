// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import { call as callTyped } from "typed-redux-saga/macro";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";

export function* exportPublication(publicationView: PublicationView) {

    const libraryAppWindow = yield* callTyped(() => getLibraryWindowFromDi());
    if (!libraryAppWindow || libraryAppWindow.isDestroyed() || libraryAppWindow.webContents.isDestroyed()) {
        return;
    }

    const publicationStorage = diMainGet("publication-storage");

    const defaultFilename =  publicationStorage.getPublicationFilename(publicationView);
    // Open a dialog to select a folder then copy the publication in it
    const res = yield* callTyped(() => dialog.showSaveDialog(
        libraryAppWindow ? libraryAppWindow : undefined,
        {
            defaultPath: defaultFilename,
            properties: ["createDirectory"],
        },
    ));

    if (!res.canceled) {
        if (res.filePath) {
            publicationStorage.copyPublicationToPath(publicationView, res.filePath);
        }
    }
}
