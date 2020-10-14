// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";

import { readiumCssUpdate } from "@r2-navigator-js/electron/renderer";

import { readerLocalActionSetConfig } from "../actions";

function updateCss(action: readerLocalActionSetConfig.TAction) {
    if (action.payload) {
        readiumCssUpdate(computeReadiumCssJsonMessage(action.payload));
    }
}

export function saga() {
    return takeSpawnEvery(
        readerLocalActionSetConfig.ID,
        updateCss,
    );
}
