// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { call as callTyped } from "typed-redux-saga/macro";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { SagaGenerator } from "typed-redux-saga";

import { getPublication } from "./getPublication";

export function* updateTags(identifier: string, tags: string[]): SagaGenerator<PublicationView> {

    const publicationRepository = diMainGet("publication-repository");

    const doc = yield* callTyped(() => publicationRepository.get(identifier));
    const newDoc = Object.assign(
        {},
        doc,
        { tags },
    );

    yield* callTyped(() => publicationRepository.save(newDoc));
    const pubView = yield* getPublication(identifier, false);

    return pubView;
}
