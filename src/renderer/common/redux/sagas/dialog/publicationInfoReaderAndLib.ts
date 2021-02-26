// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TApiMethod } from "readium-desktop/common/api/api.type";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, delay, put, take } from "redux-saga/effects";
import { race as raceTyped } from "typed-redux-saga/macro";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_READER_AND_LIB_REQUEST_ID";

// Logger
const filename_ = "readium-desktop:renderer:redux:saga:publication-info-readerAndLib";
const debug = debug_(filename_);

// Triggered when a publication-info-reader is asked
function* checkReaderAndLibPublication(action: dialogActions.openRequest.TAction) {
    if (
        action.payload?.type === DialogTypeName.PublicationInfoReader
        || action.payload?.type === DialogTypeName.PublicationInfoLib
    ) {

        const dataPayload = (action.payload as
            dialogActions.openRequest.Payload<DialogTypeName.PublicationInfoReader>).data;
        const id = dataPayload?.publicationIdentifier;

        // dispatch to API a publication get request
        if (id) {

            const { b: getAction } = yield* raceTyped({
                a: delay(5000),
                b: call(getApi, id),
            });

            if (!getAction) {
                debug("checkReaderAndLibPublication timeout?", id);
                return;
            }

            yield call(updateReaderAndLibPublication, getAction);
        }
    }
}

function* getApi(id: string) {

    yield apiSaga("publication/get", REQUEST_ID, id, true);
    while (true) {
        const action:
            apiActions.result.TAction<TReturnPromiseOrGeneratorType<TApiMethod["publication/get"]>>
            = yield take(apiActions.result.build);

        const { requestId } = action.meta.api;
        if (requestId === REQUEST_ID) {
            return action;
        }
    }
}

// Triggered when the publication data are available from the API
function* updateReaderAndLibPublication(action: apiActions.result.TAction<PublicationView>) {
    debug("reader publication from publicationInfo received");

    const publicationView = action.payload;

    if (publicationView) {
        debug("opdsPublicationResult:", publicationView);

        const publication = publicationView;

        yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoReader>({
            publication,
        }));
    }
}

export function saga() {
    return all([
        takeSpawnLeading(
            dialogActions.openRequest.ID,
            checkReaderAndLibPublication,
            (e) => debug(e),
        ),
    ]);
}
