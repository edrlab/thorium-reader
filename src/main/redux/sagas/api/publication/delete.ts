// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { diMainGet } from "readium-desktop/main/di";
import { publicationActions } from "readium-desktop/main/redux/actions";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, delay, put } from "redux-saga/effects";
import { SagaGenerator, call as callTyped } from "typed-redux-saga";
import debug_ from "debug";
import { RequesetToCloseAllReadersWithTheSamePubId } from "../../reader";

const debug = debug_("readium-desktop:main/redux/saga/api/publication/delete");

export function* deletePublication(publicationIdentifier: string/*, preservePublicationOnFileSystem?: string*/): SagaGenerator<void> {

    // yield put(readerActions.closeRequest.build(publicationIdentifier));
    yield* callTyped(RequesetToCloseAllReadersWithTheSamePubId, publicationIdentifier);

    // dispatch action to update publication/lastReadingQueue reducer
    yield put(publicationActions.deletePublication.build(publicationIdentifier));

    // delete publication from reader registry
    // yield put(winActions.registry.unregisterReaderPublication.build(identifier));

    // allow extra completion time to ensure the filesystem ZIP streams are closed
    yield delay(300);

    const publicationRepository = diMainGet("publication-repository");
    // Remove from database
    yield call(() => publicationRepository.delete(publicationIdentifier));

    try {
        const publicationStorage = diMainGet("publication-storage");
        // Remove from storage
        yield call(() => publicationStorage.removePublication(publicationIdentifier /*, preservePublicationOnFileSystem*/));
    } catch (e) {
        debug(`${e}`);
    }

    try {
        const publicationData = diMainGet("publication-data");
        // Remove from data storage
        yield call(() => publicationData.removePublication(publicationIdentifier));
    } catch (e) {
        debug(`${e}`);
    }

    const publicationViewConverter = diMainGet("publication-view-converter");
    // Remove from memory cache
    yield call(() => publicationViewConverter.removeFromMemoryCache(publicationIdentifier));
}
