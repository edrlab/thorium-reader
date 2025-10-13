// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { diMainGet } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    streamerRemovePublications,
} from "readium-desktop/main/streamer/streamerNoHttp";
import { SagaIterator } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";
import { URL_PROTOCOL_THORIUMHTTPS, URL_HOST_COMMON } from "readium-desktop/common/streamerProtocol";

// import * as portfinder from_"portfinder";
// import { Server } from "@r2-streamer-js/http/server";
// import { _USE_HTTP_STREAMER } from "readium-desktop/preprocessor-directives";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:streamer";
const debug = debug_(filename_);

// async function startStreamer(streamer: Server): Promise<string> {
//     // Find a free port on your local machine
//     const port = await portfinder.getPortPromise();
//     // HTTPS, see secureSessions()
//     await streamer.start(port, true);

//     const streamerUrl = streamer.serverUrl();
//     debug("Streamer started on %s", streamerUrl);

//     return streamerUrl;
// }

function* startRequest(): SagaIterator {
    // const streamer = _USE_HTTP_STREAMER ? yield* callTyped(() => diMainGet("streamer")) : undefined;

    try {
        // const streamerUrl = _USE_HTTP_STREAMER ?
        //     yield* callTyped(() => startStreamer(streamer)) :
        //     `${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}`;
        const streamerUrl = `${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}`;

        yield put(streamerActions.startSuccess.build(streamerUrl));
    } catch (error) {

        debug("Unable to start streamer", error);
        yield put(streamerActions.startError.build(error));
    }
}

function* stopRequest(): SagaIterator {

    // const streamer = _USE_HTTP_STREAMER ? yield* callTyped(() => diMainGet("streamer")) : undefined;

    try {
        // if (_USE_HTTP_STREAMER) {
        //     yield call(() => streamer.stop);
        // }
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

    // const streamer = _USE_HTTP_STREAMER ? yield* callTyped(() => diMainGet("streamer")) : undefined;

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
        // if (_USE_HTTP_STREAMER) {
        //     streamer.removePublications([epubPath]);
        // } else {
        //     streamerRemovePublications([epubPath]);
        // }
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
