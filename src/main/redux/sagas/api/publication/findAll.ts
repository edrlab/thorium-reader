// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { diMainGet } from "readium-desktop/main/di";
import { aboutFiltered } from "readium-desktop/main/filter";
import { call } from "typed-redux-saga";

export function* findAll() {

    const docs = yield* call(() => diMainGet("publication-repository").findAll());
    const pubConverter = yield* call(() => diMainGet("publication-view-converter"));
    const pubs = docs.map((doc) => {
        return pubConverter.convertDocumentToView(doc);
    });
    return aboutFiltered(pubs);
}
