// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { all, call, put } from "redux-saga/effects";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_READER_REQUEST_ID";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:publication-info-reader");

// Triggered when a publication-info-reader is asked
function* checkReaderPublicationWatcher() {
    while (true) {
        const action = yield* takeTyped(dialogActions.openRequest.build);

        if (action.payload?.type === "publication-info-reader") {

            const dataPayload = action.payload.data as
                dialogActions.openRequest.Payload<"publication-info-reader">["data"];
            const id = dataPayload?.publicationIndentifier;

            // dispatch to API a publication get request
            if (id) {

                yield* apiSaga("publication/get", REQUEST_ID, id);
            }
        }
    }
}

// Triggered when the publication data are available from the API
function* updateReaderPublicationWatcher() {
    while (true) {
        const action = yield* takeTyped(apiActions.result.build);
        const { requestId } = action.meta.api;

        if (requestId === REQUEST_ID) {
            debug("reader publication from publicationInfo received");

            const publicationView = action.payload as ReturnPromiseType<TApiMethod["publication/get"]>;

            if (publicationView) {
                debug("opdsPublicationResult:", publicationView);

                const publication = publicationView;

                yield put(dialogActions.updateRequest.build<"publication-info-reader">({
                    publication,
                }));
            }
        }
    }
}

export function* watchers() {
    yield all([
        call(checkReaderPublicationWatcher),
        call(updateReaderPublicationWatcher),
    ]);
}
