// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { PublicationNote } from "readium-desktop/common/publication-notes";
import { diMainGet } from "readium-desktop/main/di";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";

export function* listNotes(publicationIdentifier: string): SagaGenerator<PublicationNote[]> {

    const snapshot = yield* callTyped(() => diMainGet("publication-notes-controller").list(publicationIdentifier));

    return snapshot.notes;
}
