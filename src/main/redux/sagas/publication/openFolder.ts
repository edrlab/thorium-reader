// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { shell } from "electron";
import { diMainGet } from "readium-desktop/main/di";
import { SagaGenerator, call as callTyped } from "typed-redux-saga";

export function* openPublicationFolder(identifier?: string): SagaGenerator<void> {

    const folderPath = (yield* callTyped(() => diMainGet("publication-storage").findPublicationPath(identifier)))
        || (yield* callTyped(() => diMainGet("publication-directory").getDirectoryPath()));
    yield* callTyped(() => shell.openPath(folderPath));
}
