// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { call as callTyped } from "typed-redux-saga/macro";
import { diMainGet } from "readium-desktop/main/di";
import { aboutFiltered } from "readium-desktop/main/filter";

export function* findAll() {

    const docs = yield* callTyped(() => diMainGet("publication-repository").findAll());
    const pubConverter = yield* callTyped(() => diMainGet("publication-view-converter"));
    const pubs = docs.map((doc) => {
        return pubConverter.convertDocumentToView(doc);
    });
    return aboutFiltered(pubs);
}
