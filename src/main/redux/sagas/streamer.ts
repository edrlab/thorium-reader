// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { callTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/error";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    streamerRemovePublications, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "readium-desktop/main/streamer";
import { SagaIterator } from "redux-saga";
import { all, put } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:streamer";
const debug = debug_(filename_);

function* startRequest(): SagaIterator {

    try {
        const streamerUrl = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://host`;
        yield put(streamerActions.startSuccess.build(streamerUrl));
    } catch (error) {

        debug("Unable to start streamer", error);
        yield put(streamerActions.startError.build(error));
    }
}

function* stopRequest(): SagaIterator {

    try {
        yield put(streamerActions.stopSuccess.build());
    } catch (error) {

        debug("Unable to stop streamer", error);
        yield put(streamerActions.stopError.build(error));
    }
}

function* publicationCloseRequest(action: streamerActions.publicationCloseRequest.TAction) {

    const pubId = action.payload.publicationIdentifier;
    // will decrement on streamerActions.publicationCloseSuccess.build (see below)
    const counter = yield* selectTyped((s: RootState) => s.streamer.openPublicationCounter);

    const pubStorage = yield* callTyped(() => diMainGet("publication-storage"));

    let wasKilled = false;
    if (!counter.hasOwnProperty(pubId) || counter[pubId] <= 1) {
        wasKilled = true;

        const epubPath = pubStorage.getPublicationEpubPath(pubId);
        // const epubPath = path.join(
        //     pubStorage.getRootPath(),
        //     publicationDocument.files[0].url.substr(6),
        // );
        debug(`EPUB ZIP CLEANUP: ${epubPath}`);
        streamerRemovePublications([epubPath]);
    }

    const pubIds = Object.keys(counter);
    let l = pubIds.length;
    if (wasKilled && pubIds.includes(pubId)) {
        l--;
    }
    if (l <= 0) {
        debug("STREAMER SHUTDOWN");
        yield put(streamerActions.stopRequest.build());
    }

    // will decrement state.streamer.openPublicationCounter
    yield put(streamerActions.publicationCloseSuccess.build(pubId));
}

export function saga() {
    return all([
        takeSpawnEvery(
            streamerActions.publicationCloseRequest.ID,
            publicationCloseRequest,
            (e) => error(`${filename_}:publicationCloseRequest`, e),
        ),
        takeSpawnLeading(
            streamerActions.startRequest.ID,
            startRequest,
            (e) => error(`${filename_}:startRequest`, e),
        ),
        takeSpawnLeading(
            streamerActions.stopRequest.ID,
            stopRequest,
            (e) => error(`${filename_}:stopRequest`, e),
        ),
    ]);
}
