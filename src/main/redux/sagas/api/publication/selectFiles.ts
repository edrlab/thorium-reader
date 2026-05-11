// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import { publicationFileExtensionsForDialog } from "readium-desktop/common/extension";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";



export function* selectFiles(): SagaGenerator<string[]> {
    const win = getLibraryWindowFromDi();
    const result = yield* callTyped(() => dialog.showOpenDialog(win, {
        properties: ["openFile", "multiSelections"],
        filters: [
            {
                name: "Publications",
                extensions: publicationFileExtensionsForDialog,
            },
        ],
    }));

    return result.canceled ? [] : result.filePaths;
}

