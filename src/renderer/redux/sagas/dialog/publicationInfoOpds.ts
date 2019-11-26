// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { all, call, put } from "redux-saga/effects";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_OPDS_REQUEST_ID";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:publication-info-opds");

// global access to opdsLInksView in iterator
let linksIterator: IterableIterator<IOpdsLinkView>;

// While a link is available dispatch API Redux
function* browsePublication() {
    const linkIterator = linksIterator.next();

    // https://github.com/microsoft/TypeScript/issues/33353
    const link = linkIterator.value as IOpdsLinkView;
    if (link) {
        yield* apiSaga("opds/getPublicationFromEntry", REQUEST_ID, link.url);
    }
}

// Triggered when a publication-info-opds is asked
function* checkOpdsPublicationWatcher() {
    while (true) {
        const action = yield* takeTyped(dialogActions.openRequest.build);

        if (action.payload?.type === "publication-info-opds") {

            const dataPayload = action.payload.data as
                dialogActions.openRequest.Payload<"publication-info-opds">["data"];
            const publication = dataPayload?.publication;

            // find the entry url even if all data is already load in publication
            if (publication && Array.isArray(publication.entryLinks) && publication.entryLinks[0]) {
                linksIterator = publication.entryLinks.values();
            }
        }
    }
}

// Triggered when the publication data are available from the API
function* updateOpdsPublicationWatcher() {
    while (true) {
        const action = yield* takeTyped(apiActions.result.build);
        const { requestId } = action.meta.api;

        if (requestId === REQUEST_ID) {
            debug("opds publication from publicationInfo received");

            const publicationResult = action.payload as
                ReturnPromiseType<TApiMethod["opds/getPublicationFromEntry"]>;

            if (publicationResult.isSuccess && publicationResult.data) {
                debug("opdsPublicationResult:", publicationResult.data);

                const publication = publicationResult.data;

                if (publication.title && Array.isArray(publication.authors)) {
                    yield put(dialogActions.updateRequest.build<"publication-info-opds">({
                        publication,
                    }));
                } else {
                    yield* browsePublication();
                }
            }
        }
    }
}

export function* watchers() {
    yield all([
        call(checkOpdsPublicationWatcher),
        call(updateOpdsPublicationWatcher),
    ]);
}
