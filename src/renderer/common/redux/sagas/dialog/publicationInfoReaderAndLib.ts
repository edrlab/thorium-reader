// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { all, call, put, take } from "redux-saga/effects";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_READER_AND_LIB_REQUEST_ID";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:publication-info-readerAndLib");

// Triggered when a publication-info-reader is asked
function* checkReaderAndLibPublicationWatcher() {
    while (true) {
        const action  = yield* takeTyped(dialogActions.openRequest.build);

        if (action.payload?.type === DialogTypeName.PublicationInfoReader
            || action.payload?.type === DialogTypeName.PublicationInfoLib) {

            const dataPayload = (action.payload as
                dialogActions.openRequest.Payload<DialogTypeName.PublicationInfoReader>).data;
            const id = dataPayload?.publicationIdentifier;

            // dispatch to API a publication get request
            if (id) {
                yield* apiSaga("publication/get", REQUEST_ID, id, true);
            }
        }

        yield call(updateReaderAndLibPublicationWatcher);
    }
}

// Triggered when the publication data are available from the API
function* updateReaderAndLibPublicationWatcher() {
    const action = yield* takeTyped(apiActions.result.build);
    const { requestId } = action.meta.api;

    if (requestId === REQUEST_ID) {
        debug("reader publication from publicationInfo received");

        const publicationView = action.payload as
            ReturnPromiseType<TApiMethod["publication/get"]>;

        if (publicationView) {
            debug("opdsPublicationResult:", publicationView);

            const publication = publicationView;

            yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoReader>({
                publication,
            }));
        }
    }
}

export function* watchers() {
    yield all([
        call(checkReaderAndLibPublicationWatcher),
    ]);
}
