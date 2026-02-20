// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { diMainGet } from "readium-desktop/main/di";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call } from "redux-saga/effects";
import { SagaGenerator, call as callTyped } from "typed-redux-saga";
import { shell } from "electron";

export function* openPublicationFolder(identifier?: string): SagaGenerator<void> {

    const publicationStorage = diMainGet("publication-storage");
    const vaultPath = yield* callTyped(() => publicationStorage.getVaultPath()); // userVault || defaultVault
    
    const folderPath = (yield* callTyped(() => publicationStorage.findPublicationPath(identifier))) || vaultPath;

    yield call(() => shell.openPath(folderPath));
}
