// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { diMainGet } from "readium-desktop/main/di";

export function* findByTag(tag: string) {

    const publicationRepository = diMainGet("publication-repository");
    const publicationViewConverter = diMainGet("publication-view-converter");

    const docs = yield* callTyped(() => publicationRepository.findByTag(tag));
    return docs.map((doc) => {
        return publicationViewConverter.convertDocumentToView(doc);
    });
}
