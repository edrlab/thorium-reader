// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { TGenerator } from "readium-desktop/typings/api";

import { getPublication } from "./getPublication";

export function* updateTags(identifier: string, tags: string[]): TGenerator<PublicationView> {

    const publicationRepository = diMainGet("publication-repository");

    const doc = yield* callTyped(() => publicationRepository.get(identifier));
    const newDoc = Object.assign(
        {},
        doc,
        { tags },
    );

    yield* callTyped(() => publicationRepository.save(newDoc));
    const pubView = yield* callTyped(getPublication, identifier, false);

    return pubView;
}
