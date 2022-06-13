// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { select } from "typed-redux-saga";
import { RootState } from "../states";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:telemetry";
const debug = debug_(filename_);

export function* saga() {

    const version = yield* select((state: RootState) => state.version);

    if (_APP_VERSION !== version) {
        debug("VERSION MISMATCH", _APP_VERSION, "vs", version);
    }
}
